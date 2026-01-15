import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { requireAuthentication } from "../helpers/auth";
import { CompanyService } from "../services/companyService";
import { UserService } from "../services/userService";

// Purpose: This controller class is responsible for handling the company related requests.
@route("/company")
export class CompanyController {
  private companyService: CompanyService;
  private userService: UserService;

  constructor() {
    this.companyService = new CompanyService();
    this.userService = new UserService();
  }

  @route.post("/")
  createCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);
      const company = await this.companyService.createCompany(req.body);
      res.json(company);
    } catch (error) {
      next(error);
    }
  };

  @route.get("/:id")
  getCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const company = await this.companyService.getCompany(req.params.id);
      res.json(company);
    } catch (error) {
      next(error);
    }
  };

  @route.get("/")
  getCompanies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const users = await this.companyService.getCompanies();
      res.json(users);
    } catch (error) {
      next(error);
    }
  };

  @route.patch("/")
  updateCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const company = await this.companyService.updateCompany(req.body);
      res.json(company);
    } catch (error) {
      next(error);
    }
  };

  @route.delete("/:id")
  deleteCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      await this.companyService.deleteCompany(req.params.id);
      res.send("User deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  @route.post("/search")
  searchCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const company = await this.companyService.searchCompany(req.body);
      res.json(company);
    } catch (error) {
      next(error);
    }
  };

  @route.get("/:id/students")
  getCompanyStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await requireAuthentication(req, res);
      const students = await this.userService.getStudentsByCompany(req.params.id);
      res.json(students);
    } catch (error) {
      next(error);
    }
  };
}
