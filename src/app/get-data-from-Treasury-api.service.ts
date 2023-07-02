import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import xml2js from 'xml2js'; 
import { treasuryAPIresponse } from './data model classes/treasuryapiresponse';



@Injectable({
  providedIn: 'root'
})
export class GetDataFromTreasuryAPIService {

  constructor(private http:HttpClient) {
    this.getInterestRate(); 
  }

   //getting data function
   async getInterestRate():Promise<number>{
    let interestRate:number
    let xmlData = await this.getXMLdata()
    interestRate = this.parseXML(xmlData)
    return interestRate
  }
  
  getXMLdata():Promise<string>{
    let url = this.createURLstring()
    let xmlData = this.http.get(url, {responseType: 'text'}).toPromise()
    return xmlData
  }
  
  createURLstring():string{
    //URL must match format: https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_real_yield_curve&field_tdr_date_value_month=202305
    //So we need to get the current year and month and append it to the URL
    let today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    let monthString = month.toString();
    if (month < 10){
      monthString = "0" + monthString;
    }
    let yearString = year.toString();
    let url = "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_real_yield_curve&field_tdr_date_value_month=" + yearString + monthString;
    return url;
  }


  parseXML(xmldata):number {
      var interestRate:number
      var parser = new xml2js.Parser({trim: true, explicitArray: true});  
      parser.parseString(xmldata, function (err, result) { 
        var apiResponse:treasuryAPIresponse = result
        var entry = apiResponse.feed.entry
        var content = entry[entry.length-1].content
        interestRate = Number(content[0]['m:properties'][0]['d:TC_20YEAR'][0]._)
    })
    return interestRate
  }

  
}
