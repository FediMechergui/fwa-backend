import mongoose, { Schema, InferSchemaType } from 'mongoose';

const ContactSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  whatsapp: { type: String, required: true },
  description: { type: String, required: true },
  projectTypes: { type: [String], default: [] },
  additionalFeatures: { type: [String], default: [] },
  meetingDate: { type: Date },
  language: { type: String },
}, { timestamps: true });

export type ContactDoc = InferSchemaType<typeof ContactSchema> & { _id: mongoose.Types.ObjectId };

export const Contact = mongoose.model('Contact', ContactSchema);


