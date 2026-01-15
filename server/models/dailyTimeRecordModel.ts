import { Schema, Document, model } from 'mongoose';

export interface DailyTimeRecordModel extends Document {
    user: Schema.Types.ObjectId;
    company: Schema.Types.ObjectId;
    date: Date;
    timeIn: Date;
    timeOut?: Date;
    timeInLocation?: {
        type: 'Point';
        coordinates: number[]; // [longitude, latitude]
    };
    timeOutLocation?: {
        type: 'Point';
        coordinates: number[];
    };
    status: 'present' | 'absent' | 'late' | 'overtime';
    remarks?: string;
}

const DailyTimeRecordSchema = new Schema<DailyTimeRecordModel>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        date: { type: Date, required: true },
        timeIn: { type: Date, required: true },
        timeOut: { type: Date },
        timeInLocation: {
            type: {
                type: String,
                enum: ['Point'],
                required: false // Optional for now, but we will enforce it in controller if needed
            },
            coordinates: {
                type: [Number],
                required: false
            }
        },
        timeOutLocation: {
            type: {
                type: String,
                enum: ['Point'],
                required: false
            },
            coordinates: {
                type: [Number],
                required: false
            }
        },
        status: { type: String, enum: ['present', 'absent', 'late', 'overtime'], default: 'present' },
        remarks: { type: String }
    },
    { timestamps: true }
);

// Index for efficient querying by user and date
DailyTimeRecordSchema.index({ user: 1, date: 1 });

export const DailyTimeRecord = model<DailyTimeRecordModel>('DailyTimeRecord', DailyTimeRecordSchema);
