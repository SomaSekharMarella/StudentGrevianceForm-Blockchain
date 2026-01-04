const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * @title Comprehensive Security Tests for GrievanceSystemSecure
 * @notice Tests all security features including RBAC, access control, and visibility rules
 */
describe("GrievanceSystemSecure", function () {
  let grievanceSystem;
  let admin, student, student2, counselor, yearCoord, hod, hod2, dean, unauthorized;
  
  // Role enum values
  const Role = {
    STUDENT: 0,
    COUNSELOR: 1,
    YEAR_COORDINATOR: 2,
    HOD: 3,
    DEAN: 4,
    ADMIN: 5
  };
  
  // Status enum values
  const Status = {
    SUBMITTED: 0,
    IN_REVIEW: 1,
    ASSIGNED_TO_HOD: 2,
    ESCALATED: 3,
    RESOLVED: 4,
    CLOSED: 5
  };
  
  beforeEach(async function () {
    [admin, student, student2, counselor, yearCoord, hod, hod2, dean, unauthorized] = await ethers.getSigners();
    
    const GrievanceSystemSecure = await ethers.getContractFactory("GrievanceSystemSecure");
    grievanceSystem = await GrievanceSystemSecure.deploy();
    await grievanceSystem.waitForDeployment();
    
    // Assign roles (admin is automatically set as deployer)
    await grievanceSystem.assignRole(student.address, Role.STUDENT);
    await grievanceSystem.assignRole(student2.address, Role.STUDENT);
    await grievanceSystem.assignRole(counselor.address, Role.COUNSELOR);
    await grievanceSystem.assignRole(yearCoord.address, Role.YEAR_COORDINATOR);
    await grievanceSystem.assignRole(hod.address, Role.HOD);
    await grievanceSystem.assignRole(hod2.address, Role.HOD);
    await grievanceSystem.assignRole(dean.address, Role.DEAN);
  });

  describe("Deployment & Admin Setup", function () {
    it("Should deploy successfully", async function () {
      expect(await grievanceSystem.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should set deployer as admin", async function () {
      expect(await grievanceSystem.admin()).to.equal(admin.address);
      expect(await grievanceSystem.getUserRole(admin.address)).to.equal(Role.ADMIN);
    });

    it("Should initialize with zero grievances", async function () {
      expect(await grievanceSystem.getTotalGrievances()).to.equal(0);
    });
  });

  describe("Role Assignment Security", function () {
    it("Should allow admin to assign roles", async function () {
      await grievanceSystem.assignRole(unauthorized.address, Role.STUDENT);
      expect(await grievanceSystem.getUserRole(unauthorized.address)).to.equal(Role.STUDENT);
    });

    it("Should prevent non-admin from assigning roles", async function () {
      await expect(
        grievanceSystem.connect(counselor).assignRole(unauthorized.address, Role.STUDENT)
      ).to.be.revertedWith("GrievanceSystemSecure: Only admin can perform this action");
    });

    it("Should prevent self-assignment of roles", async function () {
      await expect(
        grievanceSystem.connect(unauthorized).assignRole(unauthorized.address, Role.STUDENT)
      ).to.be.revertedWith("GrievanceSystemSecure: Only admin can perform this action");
    });

    it("Should prevent assigning ADMIN role", async function () {
      await expect(
        grievanceSystem.assignRole(unauthorized.address, Role.ADMIN)
      ).to.be.revertedWith("GrievanceSystemSecure: Cannot assign ADMIN role");
    });

    it("Should prevent changing admin role", async function () {
      await expect(
        grievanceSystem.assignRole(admin.address, Role.STUDENT)
      ).to.be.revertedWith("GrievanceSystemSecure: Cannot change admin role");
    });

    it("Should allow admin to revoke roles", async function () {
      await grievanceSystem.revokeRole(counselor.address);
      expect(await grievanceSystem.getUserRole(counselor.address)).to.equal(0); // Default to 0 (STUDENT enum, but should be unassigned)
    });

    it("Should prevent revoking admin role", async function () {
      await expect(
        grievanceSystem.revokeRole(admin.address)
      ).to.be.revertedWith("GrievanceSystemSecure: Cannot revoke admin role");
    });
  });

  describe("Grievance Submission Security", function () {
    it("Should allow only STUDENT to submit grievances", async function () {
      const description = "Test grievance";
      await expect(grievanceSystem.connect(student).submitGrievance(description))
        .to.emit(grievanceSystem, "GrievanceSubmitted");
    });

    it("Should prevent COUNSELOR from submitting grievances", async function () {
      const description = "Test grievance";
      await expect(
        grievanceSystem.connect(counselor).submitGrievance(description)
      ).to.be.revertedWith("GrievanceSystemSecure: Only students can perform this action");
    });

    it("Should prevent YEAR_COORDINATOR from submitting grievances", async function () {
      const description = "Test grievance";
      await expect(
        grievanceSystem.connect(yearCoord).submitGrievance(description)
      ).to.be.revertedWith("GrievanceSystemSecure: Only students can perform this action");
    });

    it("Should prevent HOD from submitting grievances", async function () {
      const description = "Test grievance";
      await expect(
        grievanceSystem.connect(hod).submitGrievance(description)
      ).to.be.revertedWith("GrievanceSystemSecure: Only students can perform this action");
    });

    it("Should prevent DEAN from submitting grievances", async function () {
      const description = "Test grievance";
      await expect(
        grievanceSystem.connect(dean).submitGrievance(description)
      ).to.be.revertedWith("GrievanceSystemSecure: Only students can perform this action");
    });

    it("Should reject empty description", async function () {
      await expect(
        grievanceSystem.connect(student).submitGrievance("")
      ).to.be.revertedWith("GrievanceSystemSecure: Description cannot be empty");
    });

    it("Should track student grievances correctly", async function () {
      await grievanceSystem.connect(student).submitGrievance("Grievance 1");
      await grievanceSystem.connect(student).submitGrievance("Grievance 2");
      
      const grievances = await grievanceSystem.connect(student).getVisibleGrievances();
      expect(grievances.length).to.equal(2);
    });
  });

  describe("Grievance Visibility Security", function () {
    beforeEach(async function () {
      await grievanceSystem.connect(student).submitGrievance("Student 1 grievance");
      await grievanceSystem.connect(student2).submitGrievance("Student 2 grievance");
    });

    it("Student should only see their own grievances", async function () {
      const grievances = await grievanceSystem.connect(student).getVisibleGrievances();
      expect(grievances.length).to.equal(1);
      
      const grievance = await grievanceSystem.connect(student).getGrievanceById(1);
      expect(grievance.studentAddress).to.equal(student.address);
    });

    it("Student should not see other students' grievances", async function () {
      await expect(
        grievanceSystem.connect(student).getGrievanceById(2)
      ).to.be.revertedWith("GrievanceSystemSecure: Not authorized to view this grievance");
    });

    it("Counselor should see all student grievances", async function () {
      const grievances = await grievanceSystem.connect(counselor).getVisibleGrievances();
      expect(grievances.length).to.equal(2);
    });

    it("Year Coordinator should see grievances at their level", async function () {
      // Year Coordinator starts with no grievances (all are at Counselor level)
      const grievances = await grievanceSystem.connect(yearCoord).getVisibleGrievances();
      expect(grievances.length).to.equal(0);
      
      // After escalation from Counselor, Year Coordinator should see it
      await grievanceSystem.connect(counselor).escalateToYearCoordinator(1, "Escalating to Year Coordinator");
      const grievancesAfter = await grievanceSystem.connect(yearCoord).getVisibleGrievances();
      expect(grievancesAfter.length).to.equal(1);
      expect(grievancesAfter[0]).to.equal(1);
    });

    it("HOD should not see unassigned grievances", async function () {
      const grievances = await grievanceSystem.connect(hod).getVisibleGrievances();
      expect(grievances.length).to.equal(0);
    });

    it("HOD should only see assigned grievances", async function () {
      await grievanceSystem.connect(counselor).assignGrievanceToHOD(1, hod.address);
      const grievances = await grievanceSystem.connect(hod).getVisibleGrievances();
      expect(grievances.length).to.equal(1);
      expect(grievances[0]).to.equal(1);
    });

    it("HOD should not see grievances assigned to other HODs", async function () {
      await grievanceSystem.connect(counselor).assignGrievanceToHOD(1, hod.address);
      const grievances = await grievanceSystem.connect(hod2).getVisibleGrievances();
      expect(grievances.length).to.equal(0);
    });

    it("Dean should only see escalated grievances", async function () {
      await grievanceSystem.connect(counselor).assignGrievanceToHOD(1, hod.address);
      await grievanceSystem.connect(hod).escalateGrievance(1, "Escalating to Dean");
      
      const grievances = await grievanceSystem.connect(dean).getVisibleGrievances();
      expect(grievances.length).to.equal(1);
      expect(grievances[0]).to.equal(1);
    });
  });

  describe("Grievance Assignment to HOD", function () {
    beforeEach(async function () {
      await grievanceSystem.connect(student).submitGrievance("Test grievance");
    });

    it("Should allow counselor to assign grievance to HOD", async function () {
      await expect(
        grievanceSystem.connect(counselor).assignGrievanceToHOD(1, hod.address)
      ).to.emit(grievanceSystem, "GrievanceAssignedToHOD");
      
      const grievance = await grievanceSystem.connect(counselor).getGrievanceById(1);
      expect(grievance.assignedHOD).to.equal(hod.address);
      expect(grievance.status).to.equal(Status.ASSIGNED_TO_HOD);
    });

    it("Should allow year coordinator to assign grievance to HOD", async function () {
      await expect(
        grievanceSystem.connect(yearCoord).assignGrievanceToHOD(1, hod.address)
      ).to.emit(grievanceSystem, "GrievanceAssignedToHOD");
    });

    it("Should prevent student from assigning to HOD", async function () {
      await expect(
        grievanceSystem.connect(student).assignGrievanceToHOD(1, hod.address)
      ).to.be.revertedWith("GrievanceSystemSecure: Only counselor or year coordinator can perform this action");
    });

    it("Should prevent HOD from assigning to themselves", async function () {
      await expect(
        grievanceSystem.connect(hod).assignGrievanceToHOD(1, hod.address)
      ).to.be.revertedWith("GrievanceSystemSecure: Only counselor or year coordinator can perform this action");
    });

    it("Should require valid HOD address", async function () {
      await expect(
        grievanceSystem.connect(counselor).assignGrievanceToHOD(1, student.address)
      ).to.be.revertedWith("GrievanceSystemSecure: Address must be a HOD");
    });
  });

  describe("HOD Resolution & Escalation Security", function () {
    beforeEach(async function () {
      await grievanceSystem.connect(student).submitGrievance("Test grievance");
      await grievanceSystem.connect(counselor).assignGrievanceToHOD(1, hod.address);
    });

    it("Should allow assigned HOD to resolve grievance", async function () {
      await expect(
        grievanceSystem.connect(hod).resolveGrievance(1, "Resolved")
      ).to.emit(grievanceSystem, "GrievanceResolved");
      
      const grievance = await grievanceSystem.connect(hod).getGrievanceById(1);
      expect(grievance.status).to.equal(Status.RESOLVED);
    });

    it("Should prevent unassigned HOD from resolving", async function () {
      await expect(
        grievanceSystem.connect(hod2).resolveGrievance(1, "Resolved")
      ).to.be.revertedWith("GrievanceSystemSecure: You are not assigned to this grievance");
    });

    it("Should allow assigned HOD to escalate to Dean", async function () {
      await expect(
        grievanceSystem.connect(hod).escalateGrievance(1, "Escalating")
      ).to.emit(grievanceSystem, "GrievanceEscalated");
      
      const grievance = await grievanceSystem.connect(dean).getGrievanceById(1);
      expect(grievance.status).to.equal(Status.ESCALATED);
    });

    it("Should prevent unassigned HOD from escalating", async function () {
      await expect(
        grievanceSystem.connect(hod2).escalateGrievance(1, "Escalating")
      ).to.be.revertedWith("GrievanceSystemSecure: You are not assigned to this grievance");
    });

    it("Should prevent student from resolving", async function () {
      await expect(
        grievanceSystem.connect(student).resolveGrievance(1, "Resolved")
      ).to.be.revertedWith("GrievanceSystemSecure: Only HOD can perform this action");
    });
  });

  describe("Dean Actions Security", function () {
    beforeEach(async function () {
      await grievanceSystem.connect(student).submitGrievance("Test grievance");
      await grievanceSystem.connect(counselor).assignGrievanceToHOD(1, hod.address);
      await grievanceSystem.connect(hod).escalateGrievance(1, "Escalating to Dean");
    });

    it("Should allow Dean to close escalated grievance", async function () {
      await expect(
        grievanceSystem.connect(dean).closeGrievance(1, "Closed by Dean")
      ).to.emit(grievanceSystem, "GrievanceClosed");
      
      const grievance = await grievanceSystem.connect(dean).getGrievanceById(1);
      expect(grievance.status).to.equal(Status.CLOSED);
    });

    it("Should prevent non-Dean from closing", async function () {
      await expect(
        grievanceSystem.connect(hod).closeGrievance(1, "Closed")
      ).to.be.revertedWith("GrievanceSystemSecure: Only Dean can perform this action");
    });

    it("Should prevent closing non-escalated grievances", async function () {
      await grievanceSystem.connect(student2).submitGrievance("Another grievance");
      await expect(
        grievanceSystem.connect(dean).closeGrievance(2, "Closed")
      ).to.be.revertedWith("GrievanceSystemSecure: Can only close escalated grievances");
    });
  });

  describe("Full Workflow Security", function () {
    it("Should complete full workflow with proper access control", async function () {
      // 1. Student submits
      await grievanceSystem.connect(student).submitGrievance("Full workflow test");
      
      // 2. Counselor reviews
      await grievanceSystem.connect(counselor).reviewGrievance(1);
      let grievance = await grievanceSystem.connect(counselor).getGrievanceById(1);
      expect(grievance.status).to.equal(Status.IN_REVIEW);
      
      // 3. Counselor assigns to HOD
      await grievanceSystem.connect(counselor).assignGrievanceToHOD(1, hod.address);
      grievance = await grievanceSystem.connect(hod).getGrievanceById(1);
      expect(grievance.status).to.equal(Status.ASSIGNED_TO_HOD);
      expect(grievance.assignedHOD).to.equal(hod.address);
      
      // 4. HOD escalates to Dean
      await grievanceSystem.connect(hod).escalateGrievance(1, "Needs Dean review");
      grievance = await grievanceSystem.connect(dean).getGrievanceById(1);
      expect(grievance.status).to.equal(Status.ESCALATED);
      
      // 5. Dean closes
      await grievanceSystem.connect(dean).closeGrievance(1, "Final resolution");
      grievance = await grievanceSystem.connect(dean).getGrievanceById(1);
      expect(grievance.status).to.equal(Status.CLOSED);
    });
  });
});

