import { connectToRedux } from './redux-connector.js';
import { fetchEntityIfNeeded } from './redux-entity-fetch.js';
import { EntityStore } from './redux-entity-store.js';

/*
	A component mixin for HM entity with support for callback for updates
	- registers for store updates when attached to DOM
	- assumes one entity per component (maybe valid assumption)
	@summary A component mixin for HM entity with support for callback for updates
    @polymerMixin
*/
export const EntityMixin = function(superClass) {
	return class extends superClass {
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

		constructor() {
			super();
			connectToRedux(this);
		}

		_stateReceiver(state) {
			const entitiesByToken = state.entitiesByHref[this.href];
			const entity = entitiesByToken && entitiesByToken[this.token];
			if (entity && !entity.isFetching) {
				this._entityChanged(entity.entity);
			}
		}

		_propertiesChanged(props, changedProps, prevProps) {
			super._propertiesChanged(props, changedProps, prevProps);
			if (
				changedProps &&
				(changedProps.href !== undefined || changedProps.token !== undefined) &&
				this.href !== undefined &&
				this.token !== undefined
			) {
				this.loaded = false;
				EntityStore.dispatch(fetchEntityIfNeeded(this.href, this.token))
					.then(() => this._stateReceiver(EntityStore.getState()));
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
