# Security Audit Verification Matrix

## Overview
This document logs the default-deny Row-Level Security (RLS) enforcement and verifies positive and negative authorization behavior for the Sponsor-Backed Property Listing & Inquiry Subsystem.

---

## Authorization Matrix

| Actor / Role | Operation | Target Entity / Condition | Expected Outcome | RLS Policy Enforced | Test Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Anonymous** | `SELECT` | `properties` where `status = 'approved'` | **PASS** | `Public users can view approved properties` | Public discovery permitted for published listings |
| **Anonymous** | `SELECT` | `properties` where `status = 'draft'` | **FAIL / DENIED** | Default-Deny (No policy match) | Unapproved listings are protected from public visibility |
| **Owner A** | `UPDATE` | `properties` owned by Owner A where `status = 'draft'` | **PASS** | `Owners can update own draft or rejected properties` | Owners can edit their own draft listings prior to review |
| **Owner A** | `UPDATE` | `properties` owned by Owner B | **FAIL / DENIED** | `owner_id = auth.uid()` constraint check | Strict tenancy boundary prevents cross-owner modifications |
| **Inquirer** | `INSERT` | `inquiries` table | **PASS** | `Anyone can insert an inquiry` | Public/anonymous users can submit inquiries on listings |
| **Inquirer** | `SELECT` | `inquiries` submitted by other users | **FAIL / DENIED** | Default-Deny (`SELECT` restricted to owner/admin) | Prevents enumeration or leaking of prospective resident data |
| **Platform Admin**| `ALL` | All tables via elevated service context (`service_role`) | **PASS** | Service role override / Admin select policy | Compliance audits and administrative oversight enabled |