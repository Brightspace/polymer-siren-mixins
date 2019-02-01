import { EntityStore } from './entity-store.js';
/*
	@polymerMixin
*/
export const SirenActionMixin = function(superClass) {
	return class extends superClass {
		constructor() {
			super();
		}

		static get properties() {
			return {
				token: {
					type: String
				}
			};
		}

		/**
		 * Returns a URLSearchParams or FormData to send with request
		 */
		getSirenFields(action) {
			var url = new URL(action.href, window.location.origin);
			var fields;
			if (action.method === 'GET' || action.method === 'HEAD') {
				fields = url.searchParams;
			} else if (action.type === 'application/x-www-form-urlencoded') {
				fields = new URLSearchParams();
			} else {
				fields = new FormData();
			}

			if (action.fields && action.fields.forEach) {
				action.fields.forEach(function(field) {
					if (field.value === undefined) {
						return;
					}
					// if the field is specified multiple times, assume it is intentional
					fields.append(field.name, field.value);
				});
			}
			return fields;
		}

		/**
		 * Returns the request URL of the siren action. If the request is a GET or HEAD, the fields will be added to the query string
		 */
		getEntityUrl(action, fields) {
			if (!action) {
				return null;
			}

			var url = new URL(action.href, window.location.origin);

			fields = fields || this.getSirenFields(action);
			if (action.method === 'GET' || action.method === 'HEAD') {
				url = new URL(url.pathname + '?' + fields.toString(), url.origin);
			}

			return url;
		}

		/**
		 * Perform the specified siren action with the URLSearchParams or FormData
		 * If the action type is a JSON type, the fields will be converted to a JSON object
		 * (don't pass a JSON object directly)
		 */
		performSirenAction(action, fields) {
			if (!action) {
				return Promise.reject(new Error('No action given'));
			}
			var headers = new Headers();
			this.token && headers.append('Authorization', `Bearer ${this.token}`);

			var url = this.getEntityUrl(action, fields);
			var body;

			fields = fields || this.getSirenFields(action);
			if (action.method !== 'GET' && action.method !== 'HEAD') {
				body = fields;
			}

			if (body && action.type.indexOf('json') !== -1) {
				var json = {};
				for (var key of body.keys()) {
					json[key] = action.getFieldByName(key).value;
				}
				headers.set('Content-Type', action.type);
				body = JSON.stringify(json);
			}

			var token = this.token;

			return fetch(url.href, {
				method: action.method,
				body: body,
				headers: headers
			})
				.then(function(res) {
					if (!res.ok) {
						throw new Error(`${ res.statusText } response executing ${ action.method } on ${ url.href }.`);
					}
					return res.json();
				})
				.then(function(json) {
					return EntityStore.update(url.href, token, json);
				});
		}
	};
};
