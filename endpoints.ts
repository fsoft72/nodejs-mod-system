
import { ILRequest, ILResponse, ILApplication, ILiweConfig, ILError, ILiWE } from '../../liwe/types';
import { send_error, send_ok, typed_dict } from "../../liwe/utils";

import { perms } from '../../liwe/auth';

import {
	get_system_domains_list, post_system_domain_set, post_system_admin_domain_add, patch_system_admin_domain_update, delete_system_admin_domain_del, get_system_admin_domains_list, patch_system_admin_theme_set, get_system_theme_get, system_db_init, system_domain_get_by_session, system_domain_get_by_code, system_domain_get_by_id, system_domain_get_default
} from './methods';

import {
	SystemDomain, SystemTheme
} from './types';

/*=== d2r_start __header ===*/

/*=== d2r_end __header ===*/

/* === SYSTEM API === */
export const init = ( liwe: ILiWE ) => {
	const app = liwe.app;

	console.log( "    - System " );

	system_db_init ( liwe );


	app.get ( "/api/system/domains/list", ( req: ILRequest, res: ILResponse ) => {
		
		
		get_system_domains_list ( req, ( err: ILError, domains: SystemDomain[] ) => {
			if ( err ) return send_error( res, err );

			send_ok( res, { domains } );
		} );
	} );

	app.post ( "/api/system/domain/set", perms( [ "is-logged" ] ), ( req: ILRequest, res: ILResponse ) => {
		const { code, ___errors } = typed_dict( req.fields, [
			{ name: "code", type: "string", required: true }
		] );

		if ( ___errors.length ) return send_error ( res, { message: `Missing required fields: ${___errors.join ( ', ' )}` } );

		post_system_domain_set ( req,code,  ( err: ILError, domain: SystemDomain ) => {
			if ( err ) return send_error( res, err );

			send_ok( res, { domain } );
		} );
	} );

	app.post ( "/api/system/admin/domain/add", perms( [ "system.domain" ] ), ( req: ILRequest, res: ILResponse ) => {
		const { code, name, visible, ___errors } = typed_dict( req.fields, [
			{ name: "code", type: "string", required: true },
			{ name: "name", type: "string", required: true },
			{ name: "visible", type: "boolean", required: false, default: true }
		] );

		if ( ___errors.length ) return send_error ( res, { message: `Missing required fields: ${___errors.join ( ', ' )}` } );

		post_system_admin_domain_add ( req,code, name, visible,  ( err: ILError, domain: SystemDomain ) => {
			if ( err ) return send_error( res, err );

			send_ok( res, { domain } );
		} );
	} );

	app.patch ( "/api/system/admin/domain/update", perms( [ "system.domain" ] ), ( req: ILRequest, res: ILResponse ) => {
		const { id, code, name, visible, ___errors } = typed_dict( req.fields, [
			{ name: "id", type: "string", required: true },
			{ name: "code", type: "string", required: false },
			{ name: "name", type: "string", required: false },
			{ name: "visible", type: "boolean", required: false }
		] );

		if ( ___errors.length ) return send_error ( res, { message: `Missing required fields: ${___errors.join ( ', ' )}` } );

		patch_system_admin_domain_update ( req,id, code, name, visible,  ( err: ILError, domain: SystemDomain ) => {
			if ( err ) return send_error( res, err );

			send_ok( res, { domain } );
		} );
	} );

	app.delete ( "/api/system/admin/domain/del", perms( [ "system.domain" ] ), ( req: ILRequest, res: ILResponse ) => {
		const { id, code, ___errors } = typed_dict( req.fields, [
			{ name: "id", type: "string", required: false },
			{ name: "code", type: "string", required: false }
		] );

		if ( ___errors.length ) return send_error ( res, { message: `Missing required fields: ${___errors.join ( ', ' )}` } );

		delete_system_admin_domain_del ( req,id, code,  ( err: ILError, id_domain: string ) => {
			if ( err ) return send_error( res, err );

			send_ok( res, { id_domain } );
		} );
	} );

	app.get ( "/api/system/admin/domains/list", ( req: ILRequest, res: ILResponse ) => {
		
		
		get_system_admin_domains_list ( req, ( err: ILError, domains: SystemDomain[] ) => {
			if ( err ) return send_error( res, err );

			send_ok( res, { domains } );
		} );
	} );

	app.patch ( "/api/system/admin/theme/set", perms( [ "system.theme" ] ), ( req: ILRequest, res: ILResponse ) => {
		const { changes, ___errors } = typed_dict( req.fields, [
			{ name: "changes", type: "any", required: false }
		] );

		if ( ___errors.length ) return send_error ( res, { message: `Missing required fields: ${___errors.join ( ', ' )}` } );

		patch_system_admin_theme_set ( req,changes,  ( err: ILError, theme: SystemTheme ) => {
			if ( err ) return send_error( res, err );

			send_ok( res, { theme } );
		} );
	} );

	app.get ( "/api/system/theme/get", ( req: ILRequest, res: ILResponse ) => {
		
		
		get_system_theme_get ( req, ( err: ILError, theme: SystemTheme ) => {
			if ( err ) return send_error( res, err );

			send_ok( res, { theme } );
		} );
	} );

}
