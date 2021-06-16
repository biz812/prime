import ParentComponent from "../util/ParentComponent.js";

export default class PrimeUser extends ParentComponent{
    constructor(user, controller) {
        super(user, controller);
    }

    /**
     * @return {User}
     * @protected
     */
    get _user() {
        return this._document;
    }

    get name(){
        return this._user.name;
    }
}