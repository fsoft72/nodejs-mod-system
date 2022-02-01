
import { ILRequest, ILResponse, LCback, ILiweConfig, ILError, ILiWE } from '../../liwe/types';
import { collection_add, collection_count, collection_find_all, collection_find_by_id, collection_find_one, collection_find_one_dict, collection_find_all_dict, collection_del_one_dict, collection_del_all_dict, collection_init, mkid, prepare_filters } from '../../liwe/arangodb';
import { DocumentCollection } from 'arangojs/collection';
import { $l } from '../../liwe/locale';

import {
	SystemDomain, SystemDomainKeys, SystemTheme, SystemThemeKeys
} from './types';

let _liwe: ILiWE = null;

const _ = ( txt: string, vals: any = null, plural = false ) => {
	return $l( txt, vals, plural, "system" );
};

let _coll_system_domains: DocumentCollection = null;
let _coll_system_themes: DocumentCollection = null;

const COLL_SYSTEM_DOMAINS = "system_domains";
const COLL_SYSTEM_THEMES = "system_themes";

/*=== d2r_start __file_header === */
import { keys_filter, merge, set_attr } from '../../liwe/utils';
import { session_get, session_set_val } from '../session/methods';
import { Session } from '../session/types';

const domain_get = async ( id: string = null, code: string = null ) => {
	const [ filters, values ] = prepare_filters( 'sd', { id, code } );
	return await collection_find_one( _liwe.db, `FOR sd IN system_domains ${ filters } RETURN sd`, values );
};

const theme_get = async ( req: ILRequest, clean: boolean = false ) => {
	const domain: SystemDomain = await system_domain_get_by_session( req );
	let theme: SystemTheme = await collection_find_one_dict( req.db, COLL_SYSTEM_THEMES, { domain: domain.code } );

	if ( !theme ) theme = { domain: domain.code, data: {} };

	if ( clean ) keys_filter( theme, SystemThemeKeys );

	return theme;
};
/*=== d2r_end __file_header ===*/

// {{{ get_system_domains_list ( req: ILRequest, cback: LCBack = null ): Promise<SystemDomain[]>
/**
 * List all visible domains
 *

 *
 */
export const get_system_domains_list = ( req: ILRequest, cback: LCback = null ): Promise<SystemDomain[]> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== d2r_start get_system_domains_list ===*/
		const sds: SystemDomain[] = await collection_find_all( req.db, `FOR sd IN system_domains FILTER sd.visible == true SORT sd.name RETURN sd` );

		if ( !sds || !sds.length )
			return cback ? cback( null, sds ) : resolve( sds );

		sds.forEach( ( sd ) => keys_filter( sd, SystemDomainKeys ) );

		return cback ? cback( null, sds ) : resolve( sds );
		/*=== d2r_end get_system_domains_list ===*/
	} );
};
// }}}

// {{{ post_system_domain_set ( req: ILRequest, code: string, cback: LCBack = null ): Promise<SystemDomain>
/**
 * Set the current domain for the user
 *
 * @param code - the domain unique code [req]
 *
 */
export const post_system_domain_set = ( req: ILRequest, code: string, cback: LCback = null ): Promise<SystemDomain> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== d2r_start post_system_domain_set ===*/
		const sd: SystemDomain = await domain_get( null, code );
		const err = { message: 'Domain not found' };
		if ( !sd ) return cback ? cback( err ) : reject( err );

		await session_set_val( req, 'id_domain', sd.id );
		await session_set_val( req, 'domain_code', sd.code );

		return cback ? cback( null, null ) : resolve( null );
		/*=== d2r_end post_system_domain_set ===*/
	} );
};
// }}}

// {{{ post_system_admin_domain_add ( req: ILRequest, code: string, name: string, visible: boolean = true, cback: LCBack = null ): Promise<SystemDomain>
/**
 * Adds a domain in the system
 *
 * @param code - the domain unique code [req]
 * @param name - the user first name [req]
 * @param visible - if the domain is visible or not [opt]
 *
 */
export const post_system_admin_domain_add = ( req: ILRequest, code: string, name: string, visible: boolean = true, cback: LCback = null ): Promise<SystemDomain> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== d2r_start post_system_admin_domain_add ===*/
		const dom: SystemDomain = { code: code.toLowerCase(), name, visible, id: mkid( "system" ) };
		const sd: SystemDomain = await system_domain_get_by_code( code );
		const err = { message: 'Domain already exists' };

		if ( sd ) return cback ? cback( err ) : reject( err );

		await collection_add( _coll_system_domains, dom );

		return cback ? cback( null, dom ) : resolve( dom );
		/*=== d2r_end post_system_admin_domain_add ===*/
	} );
};
// }}}

// {{{ patch_system_admin_domain_update ( req: ILRequest, id: string, code?: string, name?: string, visible?: boolean, cback: LCBack = null ): Promise<SystemDomain>
/**
 * Updates a domain in the system
 *
 * @param id - the domain id [req]
 * @param code - the domain unique code [opt]
 * @param name - the user first name [opt]
 * @param visible - if the domain is visible or not [opt]
 *
 */
export const patch_system_admin_domain_update = ( req: ILRequest, id: string, code?: string, name?: string, visible?: boolean, cback: LCback = null ): Promise<SystemDomain> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== d2r_start patch_system_admin_domain_update ===*/
		let dom: SystemDomain = await system_domain_get_by_id( id );
		const err = { message: 'Domain code already in use by another domain' };

		if ( dom.code != code ) {
			const sd = await system_domain_get_by_code( code );
			if ( sd ) return cback ? cback( err ) : reject( err );
		}

		set_attr( dom, 'code', code );
		set_attr( dom, 'name', name );
		set_attr( dom, 'visible', visible );

		dom = await collection_add( _coll_system_domains, dom );

		return cback ? cback( null, dom ) : resolve( dom );
		/*=== d2r_end patch_system_admin_domain_update ===*/
	} );
};
// }}}

// {{{ delete_system_admin_domain_del ( req: ILRequest, id?: string, code?: string, cback: LCBack = null ): Promise<string>
/**
 * Deletes a domain from the system
 *
 * @param id - the domain id [opt]
 * @param code - the domain unique code [opt]
 *
 */
export const delete_system_admin_domain_del = ( req: ILRequest, id?: string, code?: string, cback: LCback = null ): Promise<string> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== d2r_start delete_system_admin_domain_del ===*/
		const sd: SystemDomain = await domain_get( id, code );
		const err = { message: "Domain not found" };

		if ( !sd ) return cback ? cback( err ) : reject( err );

		await _coll_system_domains.remove( ( sd as any )._id );

		return cback ? cback( null, sd.id ) : resolve( sd.id );
		/*=== d2r_end delete_system_admin_domain_del ===*/
	} );
};
// }}}

// {{{ get_system_admin_domains_list ( req: ILRequest, cback: LCBack = null ): Promise<SystemDomain[]>
/**
 * List all visible domains
 *

 *
 */
export const get_system_admin_domains_list = ( req: ILRequest, cback: LCback = null ): Promise<SystemDomain[]> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== d2r_start get_system_admin_domains_list ===*/
		const sds: SystemDomain[] = await collection_find_all( req.db, `FOR sd IN system_domains SORT sd.name RETURN sd` );

		return cback ? cback( null, sds ) : resolve( sds );
		/*=== d2r_end get_system_admin_domains_list ===*/
	} );
};
// }}}

// {{{ patch_system_admin_theme_set ( req: ILRequest, changes?: any, cback: LCBack = null ): Promise<SystemTheme>
/**
 * Patch the system Theme
 *
 * @param changes - the main changes [opt]
 *
 */
export const patch_system_admin_theme_set = ( req: ILRequest, changes?: any, cback: LCback = null ): Promise<SystemTheme> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== d2r_start patch_system_admin_theme_set ===*/
		let theme: SystemTheme = await theme_get( req );
		const data = { ...theme.data };

		merge( data, changes );
		theme = await collection_add( _coll_system_themes, theme, false, SystemThemeKeys );
		theme.data = data;

		console.log( "===== THEME: ", theme );

		return cback ? cback( null, theme ) : resolve( theme );
		/*=== d2r_end patch_system_admin_theme_set ===*/
	} );
};
// }}}

// {{{ get_system_theme_get ( req: ILRequest, cback: LCBack = null ): Promise<SystemTheme>
/**
 * Returns the current theme
 *

 *
 */
export const get_system_theme_get = ( req: ILRequest, cback: LCback = null ): Promise<SystemTheme> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== d2r_start get_system_theme_get ===*/
		const theme: SystemTheme = await theme_get( req, true );

		return cback ? cback( null, theme ) : resolve( theme );
		/*=== d2r_end get_system_theme_get ===*/
	} );
};
// }}}

// {{{ patch_system_admin_reset_id ( req: ILRequest, id: string, new_id: string, collection: string, cback: LCBack = null ): Promise<string>
/**
 * Force an id to be changed on the system
 *
 * @param id - the current id [req]
 * @param new_id - the new id [req]
 * @param collection - the collection name [req]
 *
 */
export const patch_system_admin_reset_id = ( req: ILRequest, id: string, new_id: string, collection: string, cback: LCback = null ): Promise<string> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== d2r_start patch_system_admin_reset_id ===*/
		const query = `FOR d IN ${ collection } FILTER d.id == '${ id }' UPDATE d WITH { id: '${ new_id }' } IN ${ collection }`;

		await req.db.query( query );

		return cback ? cback( null, new_id ) : resolve( new_id );
		/*=== d2r_end patch_system_admin_reset_id ===*/
	} );
};
// }}}


/**
 * Initializes system module
 *
 * @param liwe - LiWE full config [req]
 *
 */
export const system_db_init = ( liwe: ILiWE, cback: LCback = null ): Promise<boolean> => {
	return new Promise( async ( resolve, reject ) => {
		_liwe = liwe;

		_coll_system_domains = await collection_init( liwe.db, COLL_SYSTEM_DOMAINS, [
			{ type: "persistent", fields: [ "id" ], unique: true },
			{ type: "persistent", fields: [ "code" ], unique: true },
			{ type: "persistent", fields: [ "visible" ], unique: false },
		] );

		_coll_system_themes = await collection_init( liwe.db, COLL_SYSTEM_THEMES, [
			{ type: "persistent", fields: [ "id" ], unique: true },
			{ type: "persistent", fields: [ "domain" ], unique: true },
		] );

		/*=== d2r_start system_db_init ===*/
		let domain = liwe.cfg?.app?.domain || 'default';

		let sd: SystemDomain = await system_domain_get_by_code( domain );
		if ( !sd ) {
			sd = { id: mkid( "system" ), code: domain, name: "Default domain", visible: true };
			await collection_add( _coll_system_domains, sd );
		}
		/*=== d2r_end system_db_init ===*/
	} );
};

/**
 * Gets a domain by user session
 *
 * @param req - The current session request [req]
 *
 */
export const system_domain_get_by_session = ( req: ILRequest, cback: LCback = null ): Promise<SystemDomain> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== d2r_start system_domain_get_by_session ===*/
		let sd: SystemDomain = null;

		if ( !req.session ) {
			if ( req.user ) {
				const sess: Session = await session_get( req, ( req.user as any ).session_key, true );
				if ( sess.domain )
					sd = await system_domain_get_by_code( sess.domain );
			}
		} else {
			sd = await system_domain_get_by_code( req.session.domain_code );
		}

		if ( !sd ) sd = await system_domain_get_default();

		return cback ? cback( null, sd ) : resolve( sd );
		/*=== d2r_end system_domain_get_by_session ===*/
	} );
};

/**
 * Gets a domain by its code
 *
 * @param code - The Domain code [req]
 *
 */
export const system_domain_get_by_code = ( code: string, cback: LCback = null ): Promise<SystemDomain> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== d2r_start system_domain_get_by_code ===*/
		let sd: SystemDomain = null;
		if ( !code || code == '__system__' )
			sd = await system_domain_get_default();
		else
			sd = await domain_get( null, code.toLowerCase() );

		return cback ? cback( null, sd ) : resolve( sd );
		/*=== d2r_end system_domain_get_by_code ===*/
	} );
};

/**
 * Gets a domain by its id
 *
 * @param id - The Domain id [req]
 *
 */
export const system_domain_get_by_id = ( id: string, cback: LCback = null ): Promise<SystemDomain> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== d2r_start system_domain_get_by_id ===*/
		const sd: SystemDomain = await domain_get( id );

		return cback ? cback( null, sd ) : resolve( sd );
		/*=== d2r_end system_domain_get_by_id ===*/
	} );
};

/**
 * Gets the default domain
 *

 *
 */
export const system_domain_get_default = ( cback: LCback = null ): Promise<SystemDomain> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== d2r_start system_domain_get_default ===*/
		const sd: SystemDomain = await system_domain_get_by_code( _liwe.cfg.app.domain );

		return cback ? cback( null, sd ) : resolve( sd );
		/*=== d2r_end system_domain_get_default ===*/
	} );
};