import Health from './Health.js';
import {ActionPoints, XP, Soul} from './Points.js';
import Profile from "./Profile.js";
import Stats from "./Stats.js";
import DataEditor from "../util/DataManager.js";
import Util from "../util/Util.js";

export default class PrimeActor extends DataEditor {
    constructor(actor, controller) {
        super(actor, controller);
    }

    /**
     * @return {Profile}
     */
    get profile() {
        return Util.getComponentLazily(this, 'profile', Profile);
    }

    /**
     * @return {Stats}
     */
    get stats(){
        return Util.getComponentLazily(this, 'stats', Stats);
    }

    /**
     * @return {Health}
     */
    get health() {
        return Util.getComponentLazily(this, 'health', Health);
    }

    /**
     * @return {ActionPoints}
     */
    get actionPoints() {
        return Util.getComponentLazily(this, 'actionPoints', ActionPoints);
    }

    get version() {
        if(this._actorSystemData.sheetVersion) {
            switch (this._actorSystemData.sheetVersion) {
                case "v2.0":
                    return 2;
            }
        }
        return 1;
    }

    /**
     * @return {XP}
     */
    get xp() {
        return Util.getComponentLazily(this, 'xp', XP);
    }

    /**
     * @return {Soul}
     */
    get soul() {
        return Util.getComponentLazily(this, 'soul', Soul);
    }

    set actionPoints(value) {
        this.actionPoints.value = value;
    }


    /**
     * @returns {PrimePCActor}
     */
    get _actor() {
        return super._document;
    }

    get _actorData() {
        if (this.__actorData == null) {
            if (this._controller && this._controller._sheet && this._controller._sheetData) {
                this.__actorData = this._controller._sheetData.data;
            } else {
                this.__actorData = this.__actor.data;
            }
        }
        return this.__actorData;
    }

    get _actorSystemData() {
        return this._actorData.data;
    }

    /**
     * @return {User[]}
     * @protected
     */
    get _owners() {
        return Object.entries(this._actorData.permission || {})
                .filter(([key, permission]) => {
                    return key != 'default' && permission == 3;
                })
                .map(([key,]) => {
                    return game.users.get(key);
                })
                .filter((user) => !!user && !user.isGM);
    }

    get _items() {
        return this._actor.items || new Map();
    }

    _getItemsByType(type) {
        return  this._items.filter((item) => {
            return type === item.type;
        });
    }

    _getItemBySourceKey(key) {
        return this._items.find((item) => key === item.data.sourceKey);
    }

    /**
     * Is this actor a character
     * @return {boolean}
     */
    _isCharacter() {
        return this._actorData.type === 'character';
    }
}