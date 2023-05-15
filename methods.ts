
import { ILRequest, ILResponse, LCback, ILiweConfig, ILError, ILiWE } from '../../liwe/types';
import { $l } from '../../liwe/locale';

import {
	SystemDomain, SystemDomainKeys, SystemTheme, SystemThemeKeys,
} from './types';

let _liwe: ILiWE = null;

const _ = ( txt: string, vals: any = null, plural = false ) => {
	return $l( txt, vals, plural, "system" );
};

const COLL_SYSTEM_DOMAINS = "system_domains";
const COLL_SYSTEM_THEMES = "system_themes";

/*=== f2c_start __file_header === */
import { keys_filter, merge, set_attr, mkid } from '../../liwe/utils';
import { session_get, session_set_val } from '../session/methods';
import { Session } from '../session/types';
import { adb_record_add, adb_query_all, adb_query_one, adb_prepare_filters, adb_find_all, adb_find_one, adb_collection_init, adb_del_one } from '../../liwe/db/arango';
import { send_mail } from '../../liwe/mail';

const domain_get = async ( id: string = null, code: string = null ) => {
	const [ filters, values ] = adb_prepare_filters( 'sd', { id, code } );
	return await adb_query_one( _liwe.db, `FOR sd IN system_domains ${ filters } RETURN sd`, values );
};

const theme_get = async ( req: ILRequest, clean: boolean = false ) => {
	const domain: SystemDomain = await system_domain_get_by_session( req );
	let theme: SystemTheme = await adb_find_one( req.db, COLL_SYSTEM_THEMES, { domain: domain.code } );

	if ( !theme ) theme = { domain: domain.code, data: {} };

	if ( clean ) keys_filter( theme, SystemThemeKeys );

	return theme;
};
/*=== f2c_end __file_header ===*/

// {{{ get_system_domains_list ( req: ILRequest, cback: LCBack = null ): Promise<SystemDomain[]>
/**
 *
 * List all visible domains
 *
 *
 * @return domains: SystemDomain
 *
 */
export const get_system_domains_list = ( req: ILRequest, cback: LCback = null ): Promise<SystemDomain[]> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== f2c_start get_system_domains_list ===*/
		const sds: SystemDomain[] = await adb_query_all( req.db, `FOR sd IN system_domains FILTER sd.visible == true SORT sd.name RETURN sd` );

		if ( !sds || !sds.length )
			return cback ? cback( null, sds ) : resolve( sds );

		sds.forEach( ( sd ) => keys_filter( sd, SystemDomainKeys ) );

		return cback ? cback( null, sds ) : resolve( sds );
		/*=== f2c_end get_system_domains_list ===*/
	} );
};
// }}}

// {{{ post_system_domain_set ( req: ILRequest, code: string, cback: LCBack = null ): Promise<SystemDomain>
/**
 *
 * Set the current domain for the user
 *
 * @param code - the domain unique code [req]
 *
 * @return domain: SystemDomain
 *
 */
export const post_system_domain_set = ( req: ILRequest, code: string, cback: LCback = null ): Promise<SystemDomain> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== f2c_start post_system_domain_set ===*/
		const sd: SystemDomain = await domain_get( null, code );
		const err = { message: 'Domain not found' };
		if ( !sd ) return cback ? cback( err ) : reject( err );

		await session_set_val( req, 'id_domain', sd.id );
		await session_set_val( req, 'domain_code', sd.code );

		return cback ? cback( null, null ) : resolve( null );
		/*=== f2c_end post_system_domain_set ===*/
	} );
};
// }}}

// {{{ post_system_admin_domain_add ( req: ILRequest, code: string, name: string, visible?: boolean, cback: LCBack = null ): Promise<SystemDomain>
/**
 *
 * Adds a new domain to the System.
 *
 * @param code - the domain unique code [req]
 * @param name - the domain name [req]
 * @param visible - if the domain is visible or not [default: true] [opt]
 *
 * @return domain: SystemDomain
 *
 */
export const post_system_admin_domain_add = ( req: ILRequest, code: string, name: string, visible?: boolean, cback: LCback = null ): Promise<SystemDomain> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== f2c_start post_system_admin_domain_add ===*/
		const dom: SystemDomain = { code: code.toLowerCase(), name, visible, id: mkid( "system" ) };
		const sd: SystemDomain = await system_domain_get_by_code( code );
		const err = { message: 'Domain already exists' };

		if ( sd ) return cback ? cback( err ) : reject( err );

		await adb_record_add( req.db, COLL_SYSTEM_DOMAINS, dom );

		return cback ? cback( null, dom ) : resolve( dom );
		/*=== f2c_end post_system_admin_domain_add ===*/
	} );
};
// }}}

// {{{ patch_system_admin_domain_update ( req: ILRequest, id: string, code?: string, name?: string, visible?: boolean, cback: LCBack = null ): Promise<SystemDomain>
/**
 *
 * Updates a domain in the system. The `id` field must be provided.
 *
 * @param id - the domain id [req]
 * @param code - the domain unique code [opt]
 * @param name - the domain name [opt]
 * @param visible - if the domain is visible or not [opt]
 *
 * @return domain: SystemDomain
 *
 */
export const patch_system_admin_domain_update = ( req: ILRequest, id: string, code?: string, name?: string, visible?: boolean, cback: LCback = null ): Promise<SystemDomain> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== f2c_start patch_system_admin_domain_update ===*/
		let dom: SystemDomain = await system_domain_get_by_id( id );
		const err = { message: 'Domain code already in use by another domain' };

		if ( dom.code != code ) {
			const sd = await system_domain_get_by_code( code );
			if ( sd ) return cback ? cback( err ) : reject( err );
		}

		set_attr( dom, 'code', code );
		set_attr( dom, 'name', name );
		set_attr( dom, 'visible', visible );

		dom = await adb_record_add( req.db, COLL_SYSTEM_DOMAINS, dom );

		return cback ? cback( null, dom ) : resolve( dom );
		/*=== f2c_end patch_system_admin_domain_update ===*/
	} );
};
// }}}

// {{{ delete_system_admin_domain_del ( req: ILRequest, id?: string, code?: string, cback: LCBack = null ): Promise<string>
/**
 *
 * Delete a domain from the system. You can specify both `id` and `code` for deletion
 *
 * @param id - the domain id [opt]
 * @param code - the domain unique code [opt]
 *
 * @return id_domain: string
 *
 */
export const delete_system_admin_domain_del = ( req: ILRequest, id?: string, code?: string, cback: LCback = null ): Promise<string> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== f2c_start delete_system_admin_domain_del ===*/
		const sd: SystemDomain = await domain_get( id, code );
		const err = { message: "Domain not found" };

		if ( !sd ) return cback ? cback( err ) : reject( err );

		await adb_del_one( req.db, COLL_SYSTEM_DOMAINS, sd.id );

		return cback ? cback( null, sd.id ) : resolve( sd.id );
		/*=== f2c_end delete_system_admin_domain_del ===*/
	} );
};
// }}}

// {{{ get_system_admin_domains_list ( req: ILRequest, cback: LCBack = null ): Promise<SystemDomain[]>
/**
 *
 * List all domains
 *
 *
 * @return domains: SystemDomain
 *
 */
export const get_system_admin_domains_list = ( req: ILRequest, cback: LCback = null ): Promise<SystemDomain[]> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== f2c_start get_system_admin_domains_list ===*/
		const sds: SystemDomain[] = await adb_query_all( req.db, `FOR sd IN system_domains SORT sd.name RETURN sd` );

		return cback ? cback( null, sds ) : resolve( sds );
		/*=== f2c_end get_system_admin_domains_list ===*/
	} );
};
// }}}

// {{{ patch_system_admin_theme_set ( req: ILRequest, changes?: any, cback: LCBack = null ): Promise<SystemTheme>
/**
 *
 * Changes something in the system theme.
 *
 * @param changes - the main changes [opt]
 *
 * @return theme: SystemTheme
 *
 */
export const patch_system_admin_theme_set = ( req: ILRequest, changes?: any, cback: LCback = null ): Promise<SystemTheme> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== f2c_start patch_system_admin_theme_set ===*/
		let theme: SystemTheme = await theme_get( req );
		const data = { ...theme.data };

		merge( data, changes );
		theme = await adb_record_add( req.db, COLL_SYSTEM_THEMES, theme, SystemThemeKeys );
		theme.data = data;

		console.log( "===== THEME: ", theme );

		return cback ? cback( null, theme ) : resolve( theme );
		/*=== f2c_end patch_system_admin_theme_set ===*/
	} );
};
// }}}

// {{{ get_system_theme_get ( req: ILRequest, cback: LCBack = null ): Promise<SystemTheme>
/**
 *
 *
 * @return theme: SystemTheme
 *
 */
export const get_system_theme_get = ( req: ILRequest, cback: LCback = null ): Promise<SystemTheme> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== f2c_start get_system_theme_get ===*/
		const theme: SystemTheme = await theme_get( req, true );

		return cback ? cback( null, theme ) : resolve( theme );
		/*=== f2c_end get_system_theme_get ===*/
	} );
};
// }}}

// {{{ patch_system_admin_reset_id ( req: ILRequest, id: string, new_id: string, collection: string, cback: LCBack = null ): Promise<string>
/**
 *
 * Force an id to be changed on the system.
 * You have to specify the current `id`, the new `id` and the `collection` name.
 *
 * @param id - the current id [req]
 * @param new_id - the new id [req]
 * @param collection - the collection name [req]
 *
 * @return id: string
 *
 */
export const patch_system_admin_reset_id = ( req: ILRequest, id: string, new_id: string, collection: string, cback: LCback = null ): Promise<string> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== f2c_start patch_system_admin_reset_id ===*/
		const query = `FOR d IN ${ collection } FILTER d.id == '${ id }' UPDATE d WITH { id: '${ new_id }' } IN ${ collection }`;

		await req.db.query( query );

		return cback ? cback( null, new_id ) : resolve( new_id );
		/*=== f2c_end patch_system_admin_reset_id ===*/
	} );
};
// }}}

// {{{ post_system_email_test ( req: ILRequest, email: string, cback: LCBack = null ): Promise<boolean>
/**
 *
 * This endpoint tests email sending.
 * You can specify the destination email address to send the message to, but the message itself is defined by the app.
 *
 * @param email - Destination email address [req]
 *
 * @return result: boolean
 *
 */
export const post_system_email_test = ( req: ILRequest, email: string, cback: LCback = null ): Promise<boolean> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== f2c_start post_system_email_test ===*/
		const err = { message: 'Please check smtp.send_for_real in the config file' };
		if ( req.cfg.smtp.send_for_real == false )
			return cback ? cback( err, false ) : reject( err );

		try {
			await send_mail(
				"LiWE System Test Email",
				"This is a test email from LiWE",
				"This is a <b>test email</b> from LiWE",
				email,
				req.cfg.smtp.from,
				req.cfg.smtp.from,
				null,
			);

			return cback ? cback( null, true ) : resolve( true );
		} catch ( e ) {
			err.message = e.message;
			return cback ? cback( err, false ) : reject( err );
		}
		/*=== f2c_end post_system_email_test ===*/
	} );
};
// }}}

// {{{ system_domain_get_default ( cback: LCBack = null ): Promise<SystemDomain>
/**
 *
 * This function returns a `SystemDomain` structure by its id.
 *
 *
 * @return : SystemDomain
 *
 */
export const system_domain_get_default = ( cback: LCback = null ): Promise<SystemDomain> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== f2c_start system_domain_get_default ===*/
		const sd: SystemDomain = await system_domain_get_by_code( _liwe.cfg.app.domain );

		return cback ? cback( null, sd ) : resolve( sd );
		/*=== f2c_end system_domain_get_default ===*/
	} );
};
// }}}

// {{{ system_domain_get_by_id ( id: string, cback: LCBack = null ): Promise<SystemDomain>
/**
 *
 * This function returns a `SystemDomain` structure by its id.
 *
 * @param id - The Domain id [req]
 *
 * @return : SystemDomain
 *
 */
export const system_domain_get_by_id = ( id: string, cback: LCback = null ): Promise<SystemDomain> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== f2c_start system_domain_get_by_id ===*/
		const sd: SystemDomain = await domain_get( id );

		return cback ? cback( null, sd ) : resolve( sd );
		/*=== f2c_end system_domain_get_by_id ===*/
	} );
};
// }}}

// {{{ system_domain_get_by_code ( code: string, cback: LCBack = null ): Promise<SystemDomain>
/**
 *
 * This function returns a `SystemDomain` structure by its code.
 *
 * @param code - The Domain code [req]
 *
 * @return : SystemDomain
 *
 */
export const system_domain_get_by_code = ( code: string, cback: LCback = null ): Promise<SystemDomain> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== f2c_start system_domain_get_by_code ===*/
		let sd: SystemDomain = null;
		if ( !code || code == '__system__' )
			sd = await system_domain_get_default();
		else
			sd = await domain_get( null, code.toLowerCase() );

		return cback ? cback( null, sd ) : resolve( sd );
		/*=== f2c_end system_domain_get_by_code ===*/
	} );
};
// }}}

// {{{ system_domain_get_by_session ( req: ILRequest, cback: LCBack = null ): Promise<SystemDomain>
/**
 *
 * This function returns a `SystemDomain` structure by its code.
 *
 * @param req - The current session request [req]
 *
 * @return : SystemDomain
 *
 */
export const system_domain_get_by_session = ( req: ILRequest, cback: LCback = null ): Promise<SystemDomain> => {
	return new Promise( async ( resolve, reject ) => {
		/*=== f2c_start system_domain_get_by_session ===*/
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
		/*=== f2c_end system_domain_get_by_session ===*/
	} );
};
// }}}

// {{{ system_db_init ( liwe: ILiWE, cback: LCBack = null ): Promise<boolean>
/**
 *
 * Initializes the module's database
 *
 * @param liwe - The Liwe object [req]
 *
 * @return : boolean
 *
 */
export const system_db_init = ( liwe: ILiWE, cback: LCback = null ): Promise<boolean> => {
	return new Promise( async ( resolve, reject ) => {
		_liwe = liwe;

		await adb_collection_init( liwe.db, COLL_SYSTEM_DOMAINS, [
			{ type: "persistent", fields: [ "id" ], unique: true },
			{ type: "persistent", fields: [ "code" ], unique: true },
			{ type: "persistent", fields: [ "visible" ], unique: false },
		], { drop: false } );

		await adb_collection_init( liwe.db, COLL_SYSTEM_THEMES, [
			{ type: "persistent", fields: [ "id" ], unique: true },
			{ type: "persistent", fields: [ "domain" ], unique: true },
		], { drop: false } );

		/*=== f2c_start system_db_init ===*/
		let domain = liwe.cfg?.app?.domain || 'default';

		let sd: SystemDomain = await system_domain_get_by_code( domain );
		if ( !sd ) {
			sd = { id: mkid( "system" ), code: domain, name: "Default domain", visible: true };
			await adb_record_add( liwe.db, COLL_SYSTEM_DOMAINS, sd );
		}
		/*=== f2c_end system_db_init ===*/
	} );
};
// }}}


