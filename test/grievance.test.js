const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GrievanceSystem", function () {
  let grievanceSystem;
  let owner, student, counselor, yearCoord, hod, dean;
  
  beforeEach(async function () {
    [owner, student, counselor, yearCoord, hod, dean] = await ethers.getSigners();
    
    const GrievanceSystem = await ethers.getContractFactory("GrievanceSystem");
    grievanceSystem = await GrievanceSystem.deploy();
    await grievanceSystem.waitForDeployment();
    
    // Assign authorities
    await grievanceSystem.assignAuthority(counselor.address, 0); // COUNSELOR
    await grievanceSystem.assignAuthority(yearCoord.address, 1); // YEAR_COORD
    await grievanceSystem.assignAuthority(hod.address, 2); // HOD
    await grievanceSystem.assignAuthority(dean.address, 3); // DEAN
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await grievanceSystem.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should initialize with zero grievances", async function () {
      expect(await grievanceSystem.getTotalGrievances()).to.equal(0);
    });
  });

  describe("Authority Management", function () {
    it("Should assign authority role", async function () {
      await grievanceSystem.assignAuthority(counselor.address, 0);
      expect(await grievanceSystem.hasAuthorityRole(counselor.address, 0)).to.be.true;
    });

    it("Should remove authority role", async function () {
      await grievanceSystem.removeAuthority(counselor.address, 0);
      expect(await grievanceSystem.hasAuthorityRole(counselor.address, 0)).to.be.false;
    });
  });

  describe("Grievance Submission", function () {
    it("Should allow student to submit grievance", async function () {
      const description = "Test grievance description";
      await expect(grievanceSystem.connect(student).submitGrievance(description))
        .to.emit(grievanceSystem, "GrievanceSubmitted");
      
      const grievance = await grievanceSystem.getGrievanceById(1);
      expect(grievance.grievanceId).to.equal(1);
      expect(grievance.studentAddress).to.equal(student.address);
      expect(grievance.description).to.equal(description);
      expect(grievance.status).to.equal(0); // SUBMITTED
      expect(grievance.currentLevel).to.equal(0); // COUNSELOR
    });

    it("Should reject empty description", async function () {
      await expect(
        grievanceSystem.connect(student).submitGrievance("")
      ).to.be.revertedWith("GrievanceSystem: Description cannot be empty");
    });

    it("Should track student grievances", async function () {
      await grievanceSystem.connect(student).submitGrievance("Grievance 1");
      await grievanceSystem.connect(student).submitGrievance("Grievance 2");
      
      const grievances = await grievanceSystem.getStudentGrievances(student.address);
      expect(grievances.length).to.equal(2);
      expect(grievances[0]).to.equal(1);
      expect(grievances[1]).to.equal(2);
    });
  });

  describe("Grievance Review", function () {
    beforeEach(async function () {
      await grievanceSystem.connect(student).submitGrievance("Test grievance");
    });

    it("Should allow counselor to review grievance", async function () {
      await grievanceSystem.connect(counselor).reviewGrievance(1);
      const grievance = await grievanceSystem.getGrievanceById(1);
      expect(grievance.status).to.equal(1); // IN_REVIEW
    });

    it("Should reject unauthorized review", async function () {
      await expect(
        grievanceSystem.connect(yearCoord).reviewGrievance(1)
      ).to.be.revertedWith("GrievanceSystem: Not authorized for this level");
    });
  });

  describe("Grievance Resolution", function () {
    beforeEach(async function () {
      await grievanceSystem.connect(student).submitGrievance("Test grievance");
    });

    it("Should allow counselor to resolve grievance", async function () {
      const remarks = "Resolved successfully";
      await expect(grievanceSystem.connect(counselor).resolveGrievance(1, remarks))
        .to.emit(grievanceSystem, "GrievanceResolved");
      
      const grievance = await grievanceSystem.getGrievanceById(1);
      expect(grievance.status).to.equal(3); // RESOLVED
      expect(grievance.resolutionRemarks).to.equal(remarks);
      expect(grievance.resolvedBy).to.equal(counselor.address);
    });

    it("Should reject unauthorized resolution", async function () {
      await expect(
        grievanceSystem.connect(yearCoord).resolveGrievance(1, "Remarks")
      ).to.be.revertedWith("GrievanceSystem: Not authorized for this level");
    });
  });

  describe("Grievance Escalation", function () {
    beforeEach(async function () {
      await grievanceSystem.connect(student).submitGrievance("Test grievance");
    });

    it("Should allow counselor to escalate to year coordinator", async function () {
      const remarks = "Escalating to year coordinator";
      await expect(grievanceSystem.connect(counselor).escalateGrievance(1, remarks))
        .to.emit(grievanceSystem, "GrievanceEscalated");
      
      const grievance = await grievanceSystem.getGrievanceById(1);
      expect(grievance.status).to.equal(2); // ESCALATED
      expect(grievance.currentLevel).to.equal(1); // YEAR_COORD
    });

    it("Should allow year coordinator to escalate to HOD", async function () {
      await grievanceSystem.connect(counselor).escalateGrievance(1, "Escalating");
      await grievanceSystem.connect(yearCoord).escalateGrievance(1, "Escalating to HOD");
      
      const grievance = await grievanceSystem.getGrievanceById(1);
      expect(grievance.currentLevel).to.equal(2); // HOD
    });

    it("Should allow HOD to escalate to Dean", async function () {
      await grievanceSystem.connect(counselor).escalateGrievance(1, "Escalating");
      await grievanceSystem.connect(yearCoord).escalateGrievance(1, "Escalating");
      await grievanceSystem.connect(hod).escalateGrievance(1, "Escalating to Dean");
      
      const grievance = await grievanceSystem.getGrievanceById(1);
      expect(grievance.currentLevel).to.equal(3); // DEAN
    });

    it("Should prevent escalation beyond Dean", async function () {
      await grievanceSystem.connect(counselor).escalateGrievance(1, "Escalating");
      await grievanceSystem.connect(yearCoord).escalateGrievance(1, "Escalating");
      await grievanceSystem.connect(hod).escalateGrievance(1, "Escalating");
      
      await expect(
        grievanceSystem.connect(dean).escalateGrievance(1, "Cannot escalate")
      ).to.be.revertedWith("GrievanceSystem: Cannot escalate beyond Dean");
    });
  });

  describe("Grievance Closing", function () {
    beforeEach(async function () {
      await grievanceSystem.connect(student).submitGrievance("Test grievance");
      await grievanceSystem.connect(counselor).escalateGrievance(1, "Escalating");
      await grievanceSystem.connect(yearCoord).escalateGrievance(1, "Escalating");
      await grievanceSystem.connect(hod).escalateGrievance(1, "Escalating");
    });

    it("Should allow Dean to close grievance", async function () {
      const remarks = "Closed by Dean";
      await expect(grievanceSystem.connect(dean).closeGrievance(1, remarks))
        .to.emit(grievanceSystem, "GrievanceClosed");
      
      const grievance = await grievanceSystem.getGrievanceById(1);
      expect(grievance.status).to.equal(4); // CLOSED
      expect(grievance.resolvedBy).to.equal(dean.address);
    });

    it("Should reject closing by non-Dean", async function () {
      await expect(
        grievanceSystem.connect(counselor).closeGrievance(1, "Remarks")
      ).to.be.revertedWith("GrievanceSystem: Unauthorized authority");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await grievanceSystem.connect(student).submitGrievance("Grievance 1");
      await grievanceSystem.connect(student).submitGrievance("Grievance 2");
    });

    it("Should return correct total grievances", async function () {
      expect(await grievanceSystem.getTotalGrievances()).to.equal(2);
    });

    it("Should return grievance by ID", async function () {
      const grievance = await grievanceSystem.getGrievanceById(1);
      expect(grievance.grievanceId).to.equal(1);
      expect(grievance.description).to.equal("Grievance 1");
    });

    it("Should return authority grievances", async function () {
      await grievanceSystem.connect(counselor).resolveGrievance(1, "Resolved");
      const grievances = await grievanceSystem.getAuthorityGrievances(counselor.address);
      expect(grievances.length).to.equal(1);
      expect(grievances[0]).to.equal(1);
    });
  });
});

