import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { requireAuthentication } from "../helpers/auth";
import { TokenPayload } from "../helpers/interface";
import { AppError } from "../middleware/errorHandler";
import { DailyTimeRecord } from "../models/dailyTimeRecordModel";
import { Company } from "../models/companyModel";
import { UserService } from "../services/userService";

interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
    body: {
        coordinates?: [number, number]; // [lng, lat]
        remarks?: string;
    };
}

@route("/dtr")
export class DTRController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    private isPointInPolygon(point: [number, number], polygon: number[][][]) {
        // Ray casting algorithm for point in polygon
        // polygon is [[[x,y], [x,y], ...]] (GeoJSON structure usually has outer ring as first element)
        const x = point[0], y = point[1];

        let inside = false;
        // We assume the first ring is the outer boundary
        const ring = polygon[0];

        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1];
            const xj = ring[j][0], yj = ring[j][1];

            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }

    @route.post("/time-in")
    timeIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await requireAuthentication(req, res);
            const userId = (req as AuthenticatedRequest).user?.id!;
            const { coordinates, remarks } = (req as AuthenticatedRequest).body; // Expecting [lng, lat]

            // 1. Get User and their assigned Company
            const user = await this.userService.getUser(userId);
            if (!user) throw new AppError("User not found", 404);

            if (!user.metadata?.company) {
                throw new AppError("You are not assigned to any company.", 400);
            }

            const companyId = user.metadata.company; // This is an ObjectId or populated object? UserService usually populates.
            // We need to fetch the company to get the safeZone
            // If user.metadata.company is just an ID string or object with _id, handle both
            const companyIdStr = typeof companyId === 'object' ? (companyId as any)._id : companyId;

            const company = await Company.findById(companyIdStr);
            if (!company) throw new AppError("Company not found", 404);

            // 2. Check if already timed in for today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const existingDTR = await DailyTimeRecord.findOne({
                user: userId,
                date: { $gte: today }
            });

            if (existingDTR && !existingDTR.timeOut) {
                throw new AppError("You have already timed in and not timed out yet.", 400);
            }
            if (existingDTR && existingDTR.timeOut) {
                // Allow multiple time-ins? Usually no for simple DTR.
                // Or maybe just create a new record if they timed out?
                // For now, assume one DTR per day.
                throw new AppError("You have already completed your duty for today.", 400);
            }

            // 3. Geofencing Validation
            if (company.safeZone && company.safeZone.coordinates && company.safeZone.coordinates.length > 0) {
                if (!coordinates) {
                    throw new AppError("Location is required for Time In.", 400);
                }

                // GeoJSON coordinates are [lng, lat]
                // Simple point-in-polygon check or use MongoDB query if we want to be fancy.
                // Since we already have the company loaded, we can do a quick check in JS.
                // Or use specialized library. I'll use a simple ray-casting helper since I can't install backend packages easily (or prefer not to).
                // Actually, MongoDB $geoIntersects is best but requires database query.
                // Let's use MongoDB query for robustness.

                const isInside = await Company.exists({
                    _id: company._id,
                    safeZone: {
                        $geoIntersects: {
                            $geometry: {
                                type: "Point",
                                coordinates: coordinates
                            }
                        }
                    }
                });

                if (!isInside) {
                    throw new AppError("You are outside the designated Safe Zone. Please move to the company premises.", 403);
                }
            }

            // 4. Create DTR
            const newDTR = new DailyTimeRecord({
                user: userId,
                company: company._id,
                date: new Date(), // Today (with time)
                timeIn: new Date(),
                timeInLocation: coordinates ? { type: 'Point', coordinates } : undefined,
                status: 'present', // You can calculate 'late' based on schedule if you had one
                remarks
            });

            await newDTR.save();

            res.json({ message: "Time In successful", dtr: newDTR });
        } catch (error) {
            next(error);
        }
    };

    @route.post("/time-out")
    timeOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await requireAuthentication(req, res);
            const userId = (req as AuthenticatedRequest).user?.id!;
            const { coordinates, remarks } = (req as AuthenticatedRequest).body;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const dtr = await DailyTimeRecord.findOne({
                user: userId,
                date: { $gte: today },
                timeOut: { $exists: false }
            });

            if (!dtr) {
                throw new AppError("No active Time In record found for today.", 404);
            }

            // Optional: specific logic if they are outside safe zone during timeout?
            // Usually we only care about if they are there, but maybe they left early?
            // For now, just record location.

            dtr.timeOut = new Date();
            dtr.timeOutLocation = coordinates ? { type: 'Point', coordinates } : undefined;
            if (remarks) dtr.remarks = dtr.remarks ? dtr.remarks + "\n" + remarks : remarks;

            await dtr.save();

            res.json({ message: "Time Out successful", dtr });

        } catch (error) {
            next(error);
        }
    }

    @route.get("/my-records")
    getMyRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await requireAuthentication(req, res);
            const userId = (req as AuthenticatedRequest).user?.id!;

            const records = await DailyTimeRecord.find({ user: userId }).sort({ date: -1 });
            res.json(records);
        } catch (error) {
            next(error);
        }
    }
}
