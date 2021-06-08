import ActorComponent from './util/ActorComponent.js';
import {BaseValueMaxComponent,BaseMaxComponent} from './util/ComponentSupport.js';

export default class Health extends ActorComponent {
    constructor(parent) {
        super(parent);
    }
    /**
     * @return {Wounds}
     */
    get wounds() {
        return this._getComponentLazily('wounds', Wounds);
    }

    set wounds(value) {
        this.wounds.value = value;
    }
    /**
     * @return {Resilience}
     */
    get resilience() {
        return this._getComponentLazily('resilience', Resilience);
    }

    set resilience(value) {
        this.resilience.value = value;
    }
    /**
     * @return {Insanities}
     */
    get insanities() {
        return this._getComponentLazily('insanities', Insanities);
    }

    set insanities(value) {
        this.insanities.value = value;
    }
    /**
     * @return {Psyche}
     */
    get psyche() {
        return this._getComponentLazily('psyche', Psyche);
    }

    set psyche(value) {
        this.psyche.value = value;
    }
}

/**
 * Injuries have 2 states
 * Tended,
 * Tended wounds are persistant and might come back.
 * Healed,
 * Healed wounds are gone.
 */
class Injurable extends BaseMaxComponent {
    constructor(parent) {
        super(parent);
    }

    /**
     * If the injuries are tended, then the injuries count as not existing towards the total. However we need to accommodate it on the UI.
     * @return {*}
     */
    get slots() {
        return Math.max(this.value, this.max)  + this._injuriesData.filter(injury => !!injury && injury.tended).length;
    }

    get value() {
        return this._injuriesData.filter(injury => !!injury && !injury.tended).length
    }

    get injuries() {
        return this._injuriesData.filter(injury => !!injury).map(injury => {
            return {tended: injury.tended, detail: injury.detail}
        })
    }

    cleanUpData() {
        const injuriesOnly = this._injuriesData.filter(injury => !!injury);
        if(injuriesOnly.length != this._data.injuries.length) {
            this._data.injuries = injuriesOnly;
            this._update();
        }
    }

    getInjury(index) {
        return this._injuriesData[index];
    }

    get _injuriesData() {
        const data = this._data;
        if (!data.injuries) {
            data.injuries = [];
        }
        return data.injuries;
    }

    injure(detail = null) {
        this._injuriesData.push({detail, tended: false});
        this._update();
    }

    setInjuryDetail(index, detail) {
        const injury = this._injuriesData[index];
        if (injury) {
            injury.detail = detail;
        } else {
            this._injuriesData[index] = {detail, tended: false};
        }
        this._update();
    }

    cure(index) {
        const injury = this._injuriesData[index];
        if (injury) {
            // delete item at index.
            this._injuriesData[index] = null;
            this.cleanUpData();
        }
    }

    alliviate(index) {
        let injury = this._injuriesData[index];
        if (injury && !injury.tended) {
            injury.tended = true;
            if((!injury.detail) || injury.detail == 'null') {
                this._injuriesData[index] = null;
            }
            this._update();
        }
    }

    aggravate(index) {
        const injury = this._injuriesData[index];
        if (injury && injury.tended) {
            injury.tended = false;
            this._update();
        }
    }

    aggravateOrInjure(index) {
        const injury = this._injuriesData[index];
        if(injury){
            this.aggravate(index);
        } else {
            const injuryCount = this._injuriesData.filter(injury => !!injury).length;
            let count = index;
            do {
                this._injuriesData[count] = {tended:false, detail:null};
                count -= 1;
            } while(injuryCount <= count)
            this._update();
        }
    }
}

class Wounds extends Injurable {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        return this._actor.getStatBonusesFromItems("mind.health.wounds");
    }

    get _data() {
        return this._actorSystemData.health.wounds;
    }
    get _injuriesData() {
        const data = this._actorSystemData;
        // Fix for old data structure.
        if (data.wounds != null) {
            const arr = Object.values(data.wounds);
            const length = arr.length;
            data.wounds = arr.forEach((injury, idx) => {
                super._injuriesData.push({detail: injury, tended: idx >= length});
            });
            data.wounds = null;
            this._data.injuries = [];
            this._update();
        }
        return super._injuriesData;
    }
}

class Resilience extends BaseValueMaxComponent {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        return this._actor.getStatBonusesFromItems("mind.health.resilience");
    }

    get _data() {
        return this._actorSystemData.health.resilience;
    }
}

class Insanities extends Injurable {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        return this._actor.getStatBonusesFromItems("mind.insanities.max");
    }

    get _data() {
        return this._actorSystemData.mind.insanities;
    }

    get _injuriesData() {
        const data = this._actorSystemData;
        // Fix for old data structure.
        if (data.insanities != null) {
            const arr = Object.values(data.insanities);
            const length = arr.length;
            data.insanities = arr.forEach((injury, idx) => {
                super._injuriesData.push({detail: injury, tended: idx >= length});
            });
            data.insanities = null;
            this._data.injuries = [];
            this._update();
        }
        return super._injuriesData;
    }
}

class Psyche extends BaseValueMaxComponent {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        return this._actor.getStatBonusesFromItems("mind.psyche.max");
    }

    get _data() {
        return this._actorSystemData.mind.psyche;
    }
}
