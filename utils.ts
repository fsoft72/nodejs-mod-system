/**
 * Utility functions for the System module
 */

import { SystemDomain } from './types';
import { ILiWE } from '../../liwe/types';

/**
 * Generates a unique, base-36 code segment for a new domain.
 * This will be used as the complete code for root domains, or appended
 * to the parent_code using the ":" separator for subdomains.
 *
 * @returns A unique base-36 encoded string based on time elapsed since start_time
 */
export const generate_domain_segment_code = (): string => {
	const START_TIME = new Date( "2025-10-09 11:00:00" ).getTime(); // FIXME: put this in an env variable
	const dom = ( ( new Date().getTime() - START_TIME ) / 1000 / 60 ).toString( 36 );
	return dom;
};

/**
 * Extracts the parent domain code from a given domain code.
 * Returns null if the domain is a root domain (no ":" separator).
 *
 * Examples:
 * - "A:B:C" -> "A:B"
 * - "A:B" -> "A"
 * - "A" -> null
 *
 * @param domain_code - The domain code to parse
 * @returns The parent domain code, or null if it's a root domain
 */
export const get_parent_domain_code = ( domain_code: string ): string | null => {
	const parts = domain_code.split( ":" );
	if ( parts.length === 1 ) {
		return null; // Root domain
	}
	parts.pop(); // Remove last segment
	return parts.join( ":" );
};

/**
 * Validates tier allocation for creating or updating a domain.
 * Checks if the parent domain has sufficient remaining tier budget.
 *
 * Validation Rules:
 * 1. Parent must exist
 * 2. Parent must have total_max_tiers set
 * 3. Requested tiers must not exceed parent's remaining budget
 *
 * @param liwe - The LiWE instance
 * @param parent_domain - The parent domain object
 * @param requested_tiers - The number of tiers being requested
 * @param current_domain_tiers - Current tiers if updating (default: 0)
 * @returns Object with success boolean and error message if validation fails
 */
export const validate_tier_allocation = (
	parent_domain: SystemDomain | null,
	requested_tiers: number,
	current_domain_tiers: number = 0
): { success: boolean, error?: string, remaining?: number; } => {
	// Check if parent exists
	if ( !parent_domain ) {
		return {
			success: false,
			error: "Parent domain not found or is invalid"
		};
	}

	// Check if parent has total_max_tiers set
	if ( parent_domain.total_max_tiers === null || parent_domain.total_max_tiers === undefined ) {
		return {
			success: false,
			error: "Parent domain does not have tier allocation capability"
		};
	}

	// Calculate remaining budget
	const tiers_allocated = parent_domain.tiers_allocated || 0;
	const remaining = parent_domain.total_max_tiers - tiers_allocated + current_domain_tiers;

	// Validate requested tiers against remaining budget
	if ( requested_tiers > remaining ) {
		return {
			success: false,
			error: `Insufficient tiers available. Parent domain has ${ tiers_allocated } tiers allocated out of ${ parent_domain.total_max_tiers } maximum. Requested: ${ requested_tiers }`,
			remaining
		};
	}

	return { success: true, remaining };
};
