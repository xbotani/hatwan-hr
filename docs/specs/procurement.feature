# language: en
Feature: Hatwan Company Multi-Tenant Procurement System

  The system lets Companies (root entity) manage Branches, Departments and Users,
  submit Department procurement requests, obtain Admin approval/rejection with an
  automated timestamp, and generate Monthly/Yearly spending reports filterable by
  Department.

  Background:
    Given a company "Hatwan Company" exists with CEO "Mohammed Ahmed Ali"
    And the company has at least one branch, department and employee

  # ------------------------------------------------------------------
  # Organization administration
  # ------------------------------------------------------------------
  Scenario: Admin adds a company
    When an admin submits a company named "Hatwan Company"
    Then the company is persisted with a default CEO name "Mohammed Ahmed Ali"

  Scenario: Admin edits a company
    Given a company exists
    When the admin updates the company name
    Then the change is persisted without altering existing branches or departments

  Scenario: Admin removes a company
    Given a company exists
    When the admin deletes the company
    Then the company and its orphan-safe references are removed

  Scenario: Admin manages branches
    Given a company exists
    When the admin adds a branch under the company
    Then the branch is linked to the company and visible in the org tree

  Scenario: Admin manages departments
    Given a company and a branch exist
    When the admin adds a department under the company
    Then the department is linked to the company (and optionally a branch)

  Scenario: Admin manages users
    Given a company exists
    When the admin adds a user with an email, role and password
    Then the user is linked to the company with a hashed password

  # ------------------------------------------------------------------
  # Request submission
  # ------------------------------------------------------------------
  Scenario: Department submits a procurement request
    When a department employee submits a request with
      | field            | value             |
      | Requester Name   | Zana Karim        |
      | Department       | Information Tech. |
      | Requested Item   | Dell Latitude     |
      | Explanation      | Replacement work  |
      | Necessity Rating | 8                 |
    Then the request is created with status "PENDING"

  Scenario: Necessity rating must be between 1 and 10
    When a request is submitted with a necessity rating of 11
    Then the request is rejected with a validation error

  Scenario: Request must belong to an existing department in the company
    When a request is submitted with a department outside the company
    Then the request is rejected with a tenant isolation error

  # ------------------------------------------------------------------
  # Admin approval workflow
  # ------------------------------------------------------------------
  Scenario: Admin approves a pending request
    Given a pending procurement request exists
    When the admin approves the request
    Then the request status becomes "APPROVED"
    And a review timestamp is stamped automatically

  Scenario: Admin rejects a pending request
    Given a pending procurement request exists
    When the admin rejects the request
    Then the request status becomes "REJECTED"
    And a review timestamp is stamped automatically

  Scenario: A reviewed request cannot be reviewed again
    Given a request is already "APPROVED" or "REJECTED"
    When the admin attempts another decision
    Then the system responds with a conflict (409)

  # ------------------------------------------------------------------
  # Reporting
  # ------------------------------------------------------------------
  Scenario: Monthly spending report filterable by department
    Given approved requests exist for a month
    When the admin requests a monthly report for a department
    Then the report returns request count and total estimated cost for that department

  Scenario: Yearly spending report across departments
    Given approved requests exist for a year
    When the admin requests a yearly report
    Then the report groups spend by department and totals all approved requests

  Scenario: Invalid report parameters are rejected
    When a report is requested without a company id or with an invalid year
    Then the system responds with a validation error
