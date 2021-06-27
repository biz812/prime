import {BaseValueMaxComponent} from './util/ActorComponentSupport.js';
import ActorComponent from "./util/ActorComponent.js";

class Awardable extends ActorComponent {

    constructor(parent) {
        super(parent);
    }

    get value() {
        return this.initial + this.awarded - this.spent;
    }

    get initial() {
        return 0;
    }

    get awarded() {
        return 0;
    }

    get spent() {
        return 0;
    }
}

export class XP extends Awardable {

    constructor(parent) {
        super(parent);
    }

    award(value) {
        this._actorSystemData.xp.awarded += value;
        this._update();
    }

    get initial() {
        if (this._root._isCharacter()) {
            return this._actorSystemData.xp.initial;
        }
        return 0;
    }

    get awarded() {
        if (this._root._isCharacter()) {
            return this._actorSystemData.xp.awarded;
        }
        return 0;
    }

    get spent() {
        if (this._root._isCharacter()) {
            const refinementCost = this._actor.getTotalCost(this._actorSystemData.refinements);
            const perkXPCost = this._actor.getTotalPerkCost("perkCostXP");
            return refinementCost + perkXPCost;
        }
        return 0;
    }
}

export class Soul extends Awardable {

    constructor(parent) {
        super(parent);
    }

    award(value) {
        this._actorSystemData.soul.awarded += value;
        this._update();
    }
    get value() {
        return super.value - this.burnt;
    }

    get burnt() {
        return this._root._isCharacter() ? this._actorSystemData.soul.burnt || 0 : 0
    }

    burn() {
        this._actorSystemData.soul.burnt = (this._actorSystemData.soul.burnt || 0) + 1;
        this._update();
    }

    get initial() {
        if (this._root._isCharacter()) {
            return this._actorSystemData.soul.initial;
        }
        return 0;
    }

    get awarded() {
        if (this._root._isCharacter()) {
            return this._actorSystemData.soul.awarded ;
        }
        return 0;
    }

    get spent() {
        if (this._root._isCharacter()) {

            const primeCost = this._actor.getTotalCost(this._actorSystemData.primes);
            const perkSoulCost = this._actor.getTotalPerkCost("perkCostSoul");
            return primeCost + perkSoulCost;
        }
        return 0;
    }
}

export class ActionPoints extends BaseValueMaxComponent {
    constructor(parent) {
        super(parent);
    }

    get base() {
        let base = super.base;
        // fix for old sheets
        if (base == null) {
            base = this._data.base = 6;
            this._update();
        }
        return base;
    }

    get bonus() {
        return this._actor.getStatBonusesFromItems("actionPoints");
    }

    get _data() {
        return this._actorSystemData.actionPoints;
    }
}