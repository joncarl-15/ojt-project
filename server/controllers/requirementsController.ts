import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { requireAuthentication } from "../helpers/auth";
import { RequirementsService } from "../services/requirementsService";
import { TokenPayload } from "../helpers/interface";

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

@route("/requirements")
export class RequirementsController {
  private requirementsService: RequirementsService;

  constructor() {
    this.requirementsService = new RequirementsService();
  }

  @route.post("/")
  createRequirements = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const requirementsData = {
        name: req.body.name,
        program: req.body.program,
      };

      const requirements = await this.requirementsService.createRequirements(requirementsData);
      res.json(requirements);
    } catch (error) {
      next(error);
    }
  };

  @route.get("/:id")
  getRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requirements = await this.requirementsService.getRequirement(req.params.id);
      res.json(requirements);
    } catch (error) {
      next(error);
    }
  };

  @route.get("/")
  getRequirementss = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const users = await this.requirementsService.getRequirements();
      res.json(users);
    } catch (error) {
      next(error);
    }
  };

  @route.patch("/")
  updateRequirements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const requirements = await this.requirementsService.updateRequirements(req.body);
      res.json(requirements);
    } catch (error) {
      next(error);
    }
  };

  @route.delete("/:id")
  deleteRequirements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      await this.requirementsService.deleteRequirements(req.params.id);
      res.send("Requirements deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  @route.post("/search")
  searchRequirements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const requirements = await this.requirementsService.searchRequirements(req.body);
      res.json(requirements);
    } catch (error) {
      next(error);
    }
  };
}
