import { microTask } from '@polymer/polymer/lib/utils/async.js';
import { EntityStore } from './entity-store.js';
/*
	A component mixin for HM entity with support for callback for updates
	- registers for store updates when attached to DOM
	- unregisters from store updates when removed from DOM
	- unregisters old, registers new callback when href changes
	- assumes one entity per component (maybe valid assumption)
	@summary A component mixin for HM entity with support for callback for updates
    @polymerMixin
*/
export const EntityMixin = function(superClass) {
	return class extends superClass {

		constructor() {
			super();
			this._entityChanged = this._entityChanged.bind(this);
		}

		static get properties() {
			return {
				/**
				 * URI to fetch the entity from
				 */
				href: {
					type: String,
					reflectToAttribute: true
				},
				/**
				 * Bearer Auth token to attach to entity request
				 */
				token: String,
				/**
				 * Resultant entity as a JSON object
				 */
				entity: Object,
				/**
				 * True if entity is loaded. False if not loaded or loading
				 */
				loaded: {
					type: Boolean,
					value: false
				}
			};
		}

		_propertiesChanged(props, changedProps, prevProps) {
			if (changedProps && changedProps.href !== undefined) {
				this._hrefChanged(this.href);
			}
			if (changedProps && changedProps.token !== undefined) {
				this._tokenChanged(this.token);
			}
			if (
				changedProps &&
				(changedProps.href !== undefined || changedProps.token !== undefined) &&
				this.href !== undefined &&
				this.token !== undefined
			) {
				this._fetch(this.href, this.token);
			}
			super._propertiesChanged(props, changedProps, prevProps);
		}

		connectedCallback() {
			if (super.connectedCallback) {
				super.connectedCallback();
			}
		}

		disconnectedCallback() {
			if (super.disconnectedCallback) {
				super.disconnectedCallback();
			}
			if (this.href && typeof this.token === 'string') {
				EntityStore.removeListener(this.href, this.token, this._entityChanged);
			}
		}

		_hrefChanged(href, oldhref) {
			if (typeof this.token !== 'string') {
				return;
			}
			if (oldhref) {
				EntityStore.removeListener(oldhref, this.token, this._entityChanged);
			}
			if (!href) {
				return;
			}
			EntityStore.addListener(href, this.token, this._entityChanged);
			this.loaded = false;
		}

		_tokenChanged(token, oldToken) {
			if (!this.href) {
				return;
			}
			if (oldToken) {
				EntityStore.removeListener(this.href, oldToken, this._entityChanged);
			}
			if (typeof token !== 'string') {
				return;
			}
			EntityStore.addListener(this.href, token, this._entityChanged);
			this.loaded = false;
		}

		_fetch(href, token) {
			if (!href || typeof token !== 'string') {
				return;
			}
			var entity = EntityStore.fetch(this.href, token);
			if (entity.status !== 'fetching') {
				// Allows class/mixin to override _entityChanged
				microTask.run(() => this._entityChanged(entity.entity));
			}
		}

		/**
		 * Sets the `entity` property when Redux store updates. Can be overriden (to add special formatting)
		 */
		_entityChanged(entity) {
			this.entity = entity;
			this.loaded = true;
		}

	};
};
