/*=== d2r_start __header === */

/*=== d2r_end __header ===*/

/** SystemDomain */
export interface SystemDomain {
	/** the main id field */
	id?: string;
	/** The domain unique code */
	code?: string;
	/** The domain name */
	name?: string;
	/** If the domain is visible */
	visible?: boolean;
}

export const SystemDomainKeys = {
	'id': { type: 'string', priv: false },
	'code': { type: 'string', priv: false },
	'name': { type: 'string', priv: false },
	'visible': { type: 'boolean', priv: true },
};

/** SystemTheme */
export interface SystemTheme {
	/** the main id field */
	id?: string;
	/** The domain code */
	domain?: string;
	/** The Theme data */
	data?: any;
}

export const SystemThemeKeys = {
	'id': { type: 'string', priv: false },
	'domain': { type: 'string', priv: true },
	'data': { type: 'any', priv: false },
};

