/* Types file generated by flow2code */

/*=== f2c_start __file ===*/

/*=== f2c_end __file ===*/
/** SystemDomain */
export interface SystemDomain {
	/** the main id field */
	id: string;
	/** The domain unique code */
	code: string;
	/** The domain name */
	name: string;
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
	id: string;
	/** The domain code */
	domain: string;
	/** The Theme data */
	data?: any;
}

export const SystemThemeKeys = {
	'id': { type: 'string', priv: false },
	'domain': { type: 'string', priv: true },
	'data': { type: 'any', priv: false },
};

/** SystemDomainAdmin */
export interface SystemDomainAdmin {
	/** the main id field */
	id: string;
	/** The domain unique code */
	code: string;
	/** The domain name */
	name: string;
	/** If the domain is visible */
	visible: boolean;
}

export const SystemDomainAdminKeys = {
	'id': { type: 'string', priv: false },
	'code': { type: 'string', priv: false },
	'name': { type: 'string', priv: false },
	'visible': { type: 'boolean', priv: false },
};

/** SystemDomainPublic */
export interface SystemDomainPublic {
	/** the main id field */
	id: string;
	code?: string;
	name?: string;
}

export const SystemDomainPublicKeys = {
	'id': { type: 'string', priv: false },
	'code': { type: 'string', priv: false },
	'name': { type: 'string', priv: false },
};

