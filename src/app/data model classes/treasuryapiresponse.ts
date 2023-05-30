export class treasuryAPIresponse {
    feed: {
        title:string,
        id:string,
        updated:string,
        link:string,
        entry:treasuryAPIresponseEntry[]
    }
}

export class treasuryAPIresponseEntry{
    title:string
    updated:string
    author:{}
    category:string
    content:[treasuryAPIresponseEntryContentArrayItem]
}

export class treasuryAPIresponseEntryContentArrayItem {
    "m:properties":[treasuryAPIresponseEntryContentArrayItemPropertiesArrayItem]
}

export class treasuryAPIresponseEntryContentArrayItemPropertiesArrayItem {
        "d:NEW_DATE":string
        "d:TC_5YEAR":[treasuryAPIresponseInterestRateObservation]
        "d:TC_7YEAR":[treasuryAPIresponseInterestRateObservation]
        "d:TC_10YEAR":[treasuryAPIresponseInterestRateObservation]
        "d:TC_20YEAR":[treasuryAPIresponseInterestRateObservation]
        "d:TC_30YEAR":[treasuryAPIresponseInterestRateObservation]
}

export class treasuryAPIresponseInterestRateObservation {
    "_":number
}