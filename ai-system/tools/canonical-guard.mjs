#!/usr/bin/env node
/**
 * canonical-guard.mjs
 *
 * ReconAI Canonical Guard Module - Frontend Integration
 * Enforces the ReconAI Canonical Laws for all AI operations in the frontend.
 *
 * Core Principles:
 * - Advisory-only behavior (no autonomous execution)
 * - Manual-run only (requires explicit human trigger)
 * - Read-only execution mode
 * - Confidence gating >= 0.85 threshold
 * - Mandatory evidence attachment for all operations
 *
 * This module provides client-side canonical law enforcement and
 * communicates with the backend canonical-guard for validation.
 */

// Canonical Law Constants
export const CANONICAL_LAWS = {
  ADVISORY_ONLY: "advisory_only",
  MANUAL_RUN_ONLY: "manual_run_only",
  READ_ONLY_MODE: "read_only_mode",
  CONFIDENCE_THRESHOLD: 0.85,
  EVIDENCE_REQUIRED: "evidence_required",
};

// Execution modes
export const EXECUTION_MODES = {
  ADVISORY: "advisory", // Recommends actions, does not execute
  MANUAL: "manual", // Requires human trigger
  READ_ONLY: "read_only", // Can only read, not write
  BLOCKED: "blocked", // Operation blocked by canonical laws
};

// Guard state - SECURITY: Always enabled, cannot be disabled
const GUARD_ENABLED = true;

// Client-side audit trail
let clientAuditTrail = [];

/**
 * SECURITY: Guard enabled check - always returns true
 * The guard cannot be disabled as per ReconAI Canonical Laws
 */
function isGuardEnabled() {
  return GUARD_ENABLED;
}

/**
 * Check if operation has valid human trigger
 * @param {Object} operation - The operation to validate
 * @returns {boolean} - Whether human trigger is present
 */
export function hasHumanTrigger(operation) {
  if (!operation) return false;

  const validTriggers = [
    "user_click",
    "user_command",
    "explicit_approval",
    "manual_confirmation",
    "human_initiated",
    "button_click",
    "form_submit",
    "keyboard_shortcut",
  ];

  return (
    validTriggers.includes(operation.triggerType) &&
    operation.triggeredBy &&
    typeof operation.triggeredBy === "string"
  );
}

/**
 * Validate confidence score meets threshold
 * @param {number} confidence - The confidence score (0-1)
 * @returns {Object} - Validation result with pass/fail and details
 */
export function validateConfidence(confidence) {
  const threshold = CANONICAL_LAWS.CONFIDENCE_THRESHOLD;
  const passed =
    typeof confidence === "number" &&
    confidence >= threshold &&
    confidence <= 1;

  return {
    passed,
    confidence,
    threshold,
    deficit: passed ? 0 : Math.max(0, threshold - (confidence || 0)),
    message: passed
      ? `Confidence ${confidence} meets threshold ${threshold}`
      : `Confidence ${confidence || "undefined"} below threshold ${threshold}`,
  };
}

/**
 * Validate evidence attachment
 * @param {Object} evidence - The evidence object
 * @returns {Object} - Validation result
 */
export function validateEvidence(evidence) {
  const requiredFields = ["source", "timestamp", "data"];
  const missing = [];

  if (!evidence || typeof evidence !== "object") {
    return {
      valid: false,
      missing: requiredFields,
      message: "Evidence object is required but not provided",
    };
  }

  for (const field of requiredFields) {
    if (!evidence[field]) {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    evidence: missing.length === 0 ? evidence : null,
    message:
      missing.length === 0
        ? "Evidence validated successfully"
        : `Missing required evidence fields: ${missing.join(", ")}`,
  };
}

/**
 * Check if operation is read-only safe
 * @param {Object} operation - The operation to check
 * @returns {Object} - Safety check result
 */
export function isReadOnlySafe(operation) {
  const writeOperations = [
    "write",
    "update",
    "delete",
    "create",
    "modify",
    "insert",
    "remove",
    "execute",
    "deploy",
    "push",
    "post",
    "put",
    "patch",
  ];

  const operationType = operation?.type?.toLowerCase() || "";
  const operationAction = operation?.action?.toLowerCase() || "";
  const operationMethod = operation?.method?.toLowerCase() || "";

  const isWrite = writeOperations.some(
    (op) =>
      operationType.includes(op) ||
      operationAction.includes(op) ||
      operationMethod.includes(op),
  );

  return {
    safe: !isWrite,
    operationType,
    operationAction,
    message: isWrite
      ? `Write operation detected: ${operationType || operationAction || operationMethod}. Blocked in read-only mode.`
      : "Operation is read-only safe",
  };
}

/**
 * Create a human trigger context from UI event
 * @param {Event} event - DOM event
 * @param {string} userId - Current user ID
 * @returns {Object} - Human trigger context
 */
export function createHumanTriggerFromEvent(event, userId) {
  let triggerType = "human_initiated";

  if (event?.type === "click") {
    triggerType = "button_click";
  } else if (event?.type === "submit") {
    triggerType = "form_submit";
  } else if (event?.type === "keydown" || event?.type === "keyup") {
    triggerType = "keyboard_shortcut";
  }

  return {
    triggerType,
    triggeredBy: userId || "anonymous",
    triggeredAt: new Date(),
    eventType: event?.type || "unknown",
    target: event?.target?.tagName || "unknown",
  };
}

/**
 * Main guard enforcement function for frontend
 * Validates all canonical laws before allowing operation
 * @param {Object} operation - The operation to validate
 * @param {Object} context - Additional context (confidence, evidence, etc.)
 * @returns {Object} - Guard decision with detailed results
 */
export function enforceCanonicalGuard(operation, context = {}) {
  if (!isGuardEnabled()) {
    return {
      allowed: false,
      mode: EXECUTION_MODES.BLOCKED,
      reason: "SECURITY VIOLATION: Guard bypass attempted",
    };
  }

  const results = {
    timestamp: new Date().toISOString(),
    operation: operation?.id || "unknown",
    checks: {},
    allowed: false,
    mode: EXECUTION_MODES.BLOCKED,
    advisoryMessage: null,
  };

  // Check 1: Human trigger required (Manual-run only)
  results.checks.humanTrigger = {
    name: CANONICAL_LAWS.MANUAL_RUN_ONLY,
    passed: hasHumanTrigger(operation),
    details: hasHumanTrigger(operation)
      ? `Human trigger verified: ${operation.triggerType}`
      : "No valid human trigger detected",
  };

  // Check 2: Confidence threshold
  results.checks.confidence = {
    name: "confidence_threshold",
    ...validateConfidence(context.confidence),
  };

  // Check 3: Evidence attachment
  results.checks.evidence = {
    name: CANONICAL_LAWS.EVIDENCE_REQUIRED,
    ...validateEvidence(context.evidence),
  };

  // Check 4: Read-only mode
  results.checks.readOnly = {
    name: CANONICAL_LAWS.READ_ONLY_MODE,
    ...isReadOnlySafe(operation),
  };

  // Determine overall result
  const allChecksPassed = Object.values(results.checks).every(
    (check) => check.passed || check.valid || check.safe,
  );

  if (allChecksPassed) {
    results.allowed = true;
    results.mode = EXECUTION_MODES.ADVISORY;
    results.advisoryMessage =
      "Operation validated. Providing advisory recommendation only.";
  } else {
    results.allowed = false;
    results.mode = EXECUTION_MODES.BLOCKED;
    const failedChecks = Object.entries(results.checks)
      .filter(([, check]) => !(check.passed || check.valid || check.safe))
      .map(([name]) => name);
    results.advisoryMessage = `Operation blocked. Failed checks: ${failedChecks.join(", ")}`;
  }

  // Add to client audit trail
  clientAuditTrail.push({
    ...results,
    auditedAt: new Date(),
  });

  return results;
}

/**
 * Create an advisory-only response
 * Never executes - only provides recommendations
 * @param {Object} operation - The proposed operation
 * @param {Object} recommendation - The AI recommendation
 * @returns {Object} - Advisory response package
 */
export function createAdvisoryResponse(operation, recommendation) {
  return {
    type: "advisory",
    autonomous: false,
    executionAllowed: false,
    recommendation: {
      action: recommendation?.action || "review",
      rationale: recommendation?.rationale || "Requires human review",
      confidence: recommendation?.confidence || 0,
      suggestedSteps: recommendation?.steps || [],
    },
    humanActionRequired: {
      required: true,
      message:
        "This recommendation requires explicit human approval to proceed",
      uiAction: "showApprovalModal",
    },
    evidence: recommendation?.evidence || null,
    warnings: [
      "This is an advisory-only response",
      "No autonomous execution will occur",
      "Human approval required for any action",
    ],
  };
}

/**
 * Create evidence attachment for operation
 * @param {string} source - Source of evidence
 * @param {Object} data - Evidence data
 * @returns {Object} - Complete evidence attachment
 */
export function createEvidence(source, data) {
  const timestamp = new Date().toISOString();
  return {
    source,
    timestamp,
    data,
    clientGenerated: true,
    canonicalCompliant: true,
  };
}

/**
 * Get client audit trail
 * @returns {Array} - Array of audit entries
 */
export function getClientAuditTrail() {
  return [...clientAuditTrail];
}

/**
 * Clear client audit trail (for testing only)
 */
export function clearClientAuditTrail() {
  clientAuditTrail = [];
}

/**
 * Get canonical law constants
 * @returns {Object} - The canonical laws
 */
export function getCanonicalLaws() {
  return { ...CANONICAL_LAWS };
}

/**
 * Get execution modes
 * @returns {Object} - The execution modes
 */
export function getExecutionModes() {
  return { ...EXECUTION_MODES };
}

/**
 * UI Helper: Create approval request for user
 * @param {Object} operation - The operation requiring approval
 * @param {Object} guardResult - Result from enforceCanonicalGuard
 * @returns {Object} - Approval request for UI display
 */
export function createApprovalRequest(operation, guardResult) {
  return {
    id: `approval-${Date.now()}`,
    operation,
    guardResult,
    requiredAction: "user_approval",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    displayMessage: guardResult.allowed
      ? "Operation ready for approval"
      : `Operation requires attention: ${guardResult.advisoryMessage}`,
    actions: [
      { label: "Approve", action: "approve", style: "primary" },
      { label: "Reject", action: "reject", style: "danger" },
      { label: "Review Details", action: "review", style: "secondary" },
    ],
  };
}

/**
 * Validate operation against canonical laws before API call
 * Use this wrapper around fetch/API calls
 * @param {Object} operation - Operation details
 * @param {Object} context - Context including human trigger
 * @returns {Object} - Validation result with proceed flag
 */
export function validateBeforeApiCall(operation, context) {
  const guardResult = enforceCanonicalGuard(operation, context);

  return {
    proceed: guardResult.allowed,
    guardResult,
    message: guardResult.advisoryMessage,
    requiresApproval: !guardResult.allowed && isReadOnlySafe(operation).safe,
  };
}

// Export for CommonJS compatibility if needed
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CANONICAL_LAWS,
    EXECUTION_MODES,
    hasHumanTrigger,
    validateConfidence,
    validateEvidence,
    isReadOnlySafe,
    createHumanTriggerFromEvent,
    enforceCanonicalGuard,
    createAdvisoryResponse,
    createEvidence,
    getClientAuditTrail,
    clearClientAuditTrail,
    getCanonicalLaws,
    getExecutionModes,
    createApprovalRequest,
    validateBeforeApiCall,
  };
}
