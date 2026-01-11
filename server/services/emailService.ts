import nodemailer from "nodemailer";
import { UserRepository } from "../repositories/userRepository";
import { MessageRepository } from "../repositories/messageRepository";
import { AnnouncementModel } from "../models/announcementModel";
import { MessageModel } from "../models/messageModel";
import { UserModel } from "../models/userModel";
import { generateEmailHtml } from "../utils/emailTemplates";

export class EmailService {
  private transporter: nodemailer.Transporter;
  private userRepository: UserRepository;
  private messageRepository: MessageRepository;

  private isConfigured: boolean = false;

  constructor() {
    this.userRepository = new UserRepository();
    this.messageRepository = new MessageRepository();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      this.isConfigured = true;
    } else {
      // Initialize with a dummy transporter or null, handled by isConfigured check
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      console.warn("Email credentials not found in environment variables. Email notifications will be disabled.");
    }
  }

  /**
   * Send announcement notification email to students in the same program as coordinator
   * @param announcement - Announcement data
   * @param coordinatorId - ID of the coordinator creating the announcement
   */
  async sendAnnouncementNotificationToStudents(
    announcement: AnnouncementModel,
    coordinatorId: string
  ): Promise<void> {
    if (!this.isConfigured) return;

    try {
      // Get coordinator data to determine their program
      const coordinator = await this.userRepository.getUser(coordinatorId);
      if (!coordinator) {
        console.log("Coordinator not found");
        return;
      }

      // Get students from the same program as the coordinator
      const students = (await this.userRepository.searchUser(
        {
          role: "student",
          program: coordinator.program,
        },
        { multiple: true, populate: false }
      )) as UserModel[];

      const emailRecipients = students
        .filter((student) => student.email)
        .map((student) => student.email);

      if (emailRecipients.length === 0) {
        console.log(`No students with email addresses found in ${coordinator.program} program`);
        return;
      }

      // Prepare email content
      const emailSubject = `New Announcement: ${announcement.title}`;

      const emailBody = generateEmailHtml({
        title: "New Announcement",
        greeting: "Dear Student,",
        mainContent: `
          <p>Please be advised that a new announcement has been posted by your Coordinator, <strong>${coordinator.firstName} ${coordinator.lastName}</strong>.</p>
          
          <div class="card">
            <div class="label">Subject</div>
            <div class="value"><strong>${announcement.title}</strong></div>
            
            <div class="label">Date Posted</div>
            <div class="value">${new Date((announcement as any).createdAt || Date.now()).toLocaleDateString()}</div>
            
            <div class="label">Content</div>
            <div class="value">
              <div class="message-box">
                "${announcement.content}"
              </div>
            </div>
          </div>
          
          <p>Please take note of this announcement.</p>
        `,
        // actionText and actionUrl removed
      });

      // Send email to all recipients
      const mailOptions = {
        from: process.env.EMAIL_USER,
        bcc: emailRecipients, // Using BCC to hide recipient list
        subject: emailSubject,
        html: emailBody,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(
        `Announcement notification sent to ${emailRecipients.length} ${coordinator.program} students`
      );
    } catch (error: any) {
      console.error("Failed to send announcement notification emails:", error);
      // Don't throw error to avoid breaking the announcement creation process
    }
  }

  /**
   * Send message notification email to the recipient
   * @param message - Message data (populated with sender and receiver)
   */
  async sendMessageNotificationToRecipient(message: MessageModel): Promise<void> {
    if (!this.isConfigured) return;

    try {
      // Get populated message data
      const populatedMessage = await this.messageRepository.getMessage(message._id);
      if (!populatedMessage || !populatedMessage.receiver || !populatedMessage.sender) {
        console.log("Message data incomplete for email notification");
        return;
      }

      const sender = populatedMessage.sender as any as UserModel;
      const receiver = populatedMessage.receiver as any as UserModel;

      // Only send email if sender is coordinator and receiver is student from same program
      if (sender.role !== "coordinator" || receiver.role !== "student") {
        return; // Don't send email for non-coordinator to student messages
      }

      // Check if both users are from the same program
      if (sender.program !== receiver.program) {
        console.log("Sender and receiver are from different programs, not sending email");
        return;
      }

      if (!receiver.email) {
        console.log("Receiver has no email address");
        return;
      }

      // Prepare email content
      const emailSubject = `New Message from ${sender.firstName} ${sender.lastName}`;

      const emailBody = generateEmailHtml({
        title: "New Private Message",
        greeting: "Dear Student,",
        mainContent: `
          <p>You have received a new private message from your Coordinator, <strong>${sender.firstName} ${sender.lastName}</strong>.</p>
          
          <div class="card">
            <div class="label">Message Content</div>
            <div class="value">
              <div class="message-box">
                "${message.content}"
              </div>
            </div>
          </div>
          
          <p>Please log in to your dashboard to view and respond to this message.</p>
        `,
        // actionText and actionUrl removed
      });

      // Send email to recipient
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: receiver.email,
        subject: emailSubject,
        html: emailBody,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Message notification sent to ${receiver.email}`);
    } catch (error: any) {
      console.error("Failed to send message notification email:", error);
      // Don't throw error to avoid breaking the message creation process
    }
  }


  /**
   * Verify email configuration
   */
  async verifyEmailConfig(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("Email configuration verification failed:", error);
      return false;
    }
  }

  /**
   * Send password reset code
   * @param email - Recipient email
   * @param code - Reset code
   */
  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    if (!this.isConfigured) return;

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Request - OJT Monitoring System",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4CAF50;">Password Reset Request</h2>
            <p>You have requested to reset your password. Use the following code to proceed:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">
              ${code}
            </div>
            <p style="margin-top: 20px;">If you did not request this, please ignore this email.</p>
          </div>
        `
      };
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset code sent to ${email}`);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }
  }

  /**
   * Send notification for admin email change verification
   * @param email - New email address
   * @param code - Verification code
   */
  async sendEmailChangeVerificationCode(email: string, code: string): Promise<void> {
    if (!this.isConfigured) return;

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify Email Change - OJT Monitoring System",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2196F3;">Verify Your New Email</h2>
            <p>You have requested to change your admin account email to this address.</p>
            <p>Please use the following verification code to confirm this change:</p>
            <div style="background-color: #e3f2fd; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1565C0;">
              ${code}
            </div>
            <p style="margin-top: 20px;">If you did not initiate this request, please contact support immediately.</p>
          </div>
        `
      };
      await this.transporter.sendMail(mailOptions);
      console.log(`Email change verification code sent to ${email}`);
    } catch (error) {
      console.error("Failed to email change verification:", error);
    }
  }

  /**
   * Send account creation notification with credentials
   */
  async sendAccountCreatedNotification(email: string, userName: string, password: string, role: string, firstName: string, lastName: string): Promise<void> {
    if (!this.isConfigured) return;

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Account Created - OJT Monitoring System",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4CAF50;">Welcome to OJT Monitoring System!</h2>
            <p>Hello ${firstName} ${lastName},</p>
            <p>Your <strong>${role}</strong> account has been successfully created. Here are your login credentials:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; border-radius: 3px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Username:</strong> ${userName}</p>
              <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
            </div>
            <p>Please log in immediately and change your password for security.</p>
            <div style="text-align: center; margin-top: 25px;">
               <!-- Button removed -->
            </div>
          </div>
        `
      };
      await this.transporter.sendMail(mailOptions);
      console.log(`Account creation email sent to ${email}`);
    } catch (error) {
      console.error("Failed to send account creation email:", error);
    }
  }

  /**
   * Send task assignment notification
   */
  async sendTaskAssignmentNotification(email: string, title: string, description: string, dueDate: Date, assignerName: string): Promise<void> {
    if (!this.isConfigured) return;

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "New Task Assignment - OJT Monitoring System",
        html: generateEmailHtml({
          title: "New Task Assignment",
          greeting: "Dear Student,",
          mainContent: `
            <p>This is to inform you that a new task has been assigned to you by <strong>${assignerName}</strong>. Please see the details below:</p>
            
            <div class="card">
              <div class="label">Task Title</div>
              <div class="value"><strong>${title}</strong></div>
              
              <div class="label">Description</div>
              <div class="value">${description}</div>
              
              <div class="label">Due Date</div>
              <div class="value">${new Date(dueDate).toLocaleDateString()}</div>
              
              <div class="label">Assigned By</div>
              <div class="value">${assignerName}</div>
            </div>
            
            <p>Please log in to your dashboard to view the full details and submit your work.</p>
          `,
          // actionText and actionUrl removed
        })
      };
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Failed to send task assignment email:", error);
    }
  }

  /**
   * Send task status update (completion)
   */
  async sendTaskStatusUpdateNotification(email: string, title: string, status: string): Promise<void> {
    if (!this.isConfigured) return;

    try {
      const isCompleted = status === 'completed';
      const subject = isCompleted ? `Task Approved - ${title}` : `Task Updated - ${title}`;
      const statusText = isCompleted ? 'APPROVED' : status.toUpperCase();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        html: generateEmailHtml({
          title: subject,
          greeting: "Dear Student,",
          mainContent: `
            <p>We would like to inform you that the status of your task <strong>"${title}"</strong> has been updated.</p>
            
            <div class="card">
              <div class="label">Current Status</div>
              <div class="value">
                <span class="status-badge ${isCompleted ? 'status-success' : 'status-info'}">
                  ${statusText}
                </span>
              </div>
            </div>
            
            <p>Please keep up the good work.</p>
          `,
          // actionText and actionUrl removed
        })
      };
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Failed to send task status email:", error);
    }
  }

  /**
   * Send document status update (approved/rejected)
   */
  async sendDocumentStatusUpdateNotification(email: string, documentName: string, status: string, remarks?: string, reviewedBy?: string): Promise<void> {
    if (!this.isConfigured) return;

    try {
      const isApproved = status === 'approved';
      const subject = isApproved ? `Document Approved - ${documentName}` : `Document Rejected - ${documentName}`;
      const reviewerLabel = isApproved ? "Approved By" : "Rejected By";

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        html: generateEmailHtml({
          title: subject,
          greeting: "Dear Student,",
          mainContent: `
            <p>Please be advised that your document <strong>"${documentName}"</strong> has been <span class="status-badge ${isApproved ? 'status-success' : 'status-error'}">${status.toUpperCase()}</span> by <strong>${reviewedBy || 'Coordinator'}</strong>.</p>
            
            ${remarks || reviewedBy ? `
              <div class="card">
                ${reviewedBy ? `
                  <div class="label">${reviewerLabel}</div>
                  <div class="value">${reviewedBy}</div>
                ` : ''}
              </div>
            ` : ''}
            
            <p>Please log in to the system to review details.</p>
          `,
          // actionText and actionUrl removed
        })
      };
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Failed to send document status email:", error);
    }
  }

  /**
   * Send notification for group chat message
   */
  async sendGroupMessageNotification(message: MessageModel, conversationId: string): Promise<void> {
    if (!this.isConfigured) return;

    try {
      // Need to dynamically import to avoid circular dependency if possible, or just rely on models
      const { Conversation } = await import("../models/conversationModel");
      const conversation = await Conversation.findById(conversationId).populate('participants');

      if (!conversation) return;

      const sender = await this.userRepository.getUser(message.sender as any);
      if (!sender || sender.role !== 'coordinator') return; // Only notify if sender is coordinator

      const participants = conversation.participants as any as UserModel[];

      // Filter students
      const students = participants.filter(p => p.role === 'student' && p.email);

      if (students.length === 0) return;

      const emailRecipients = students.map(s => s.email);

      // Prepare email content
      const emailSubject = `New Group Message from ${sender.firstName} ${sender.lastName} `;

      const emailBody = generateEmailHtml({
        title: "New Group Message",
        greeting: "Dear Student,",
        mainContent: `
          <p>Please be informed that your Coordinator, <strong>${sender.firstName} ${sender.lastName}</strong>, has sent a message to the group chat.</p>
          
          <div class="card">
            <div class="label">Message Content</div>
            <div class="value">
              <div class="message-box">
                "${message.content}"
              </div>
            </div>
          </div>
          
          <p>Please log in to the OJT Monitoring System to reply.</p>
        `,
        // actionText and actionUrl removed
      });

      // Send email to all recipients
      const mailOptions = {
        from: process.env.EMAIL_USER,
        bcc: emailRecipients,
        subject: emailSubject,
        html: emailBody,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Group message notification sent to ${emailRecipients.length} students`);

    } catch (error) {
      console.error("Failed to send group message notification:", error);
    }
  }
}
