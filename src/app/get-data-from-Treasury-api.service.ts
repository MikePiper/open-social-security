import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { XMLParser } from 'fast-xml-parser';
import { treasuryAPIresponse } from './data model classes/treasuryapiresponse';

@Injectable({
  providedIn: 'root'
})
export class GetDataFromTreasuryAPIService {

  constructor(private http: HttpClient) {
    this.getInterestRate();
  }

  // Getting data function
  async getInterestRate(): Promise<number> {
    const xmlData = await this.getXMLdata();
    const interestRate = this.parseXML(xmlData);
    return interestRate;
  }

  getXMLdata(): Promise<string> {
    const url = this.createURLstring();
    return this.http.get(url, { responseType: 'text' }).toPromise();
  }

  createURLstring(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const monthString = month < 10 ? `0${month}` : month.toString();
    const url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_real_yield_curve&field_tdr_date_value_month=${year}${monthString}`;
    return url;
  }

  parseXML(xmldata: string): number {
    let interestRate = 0;

    // Create a fast-xml-parser instance
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      trimValues: true
    });

    // Parse the XML string
    const result = parser.parse(xmldata) as any;

    // Map the parsed object to your data structure
    const apiResponse: treasuryAPIresponse = result;
    const entries = apiResponse.feed?.entry;

    if (entries && entries.length > 0) {
      const lastEntry = entries[entries.length - 1];
      const content = lastEntry?.content;
      if (content && content[0]?.['m:properties']?.[0]?.['d:TC_20YEAR']) {
        interestRate = Number(content[0]['m:properties'][0]['d:TC_20YEAR'][0]?._ ?? 0);
      }
    }

    return interestRate;
  }
}
