import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { XMLParser } from 'fast-xml-parser';

@Injectable({
  providedIn: 'root'
})
export class GetDataFromTreasuryAPIService {
  constructor(private http: HttpClient) {
    this.getInterestRate(); // Optional: call manually if you prefer
  }

  async getInterestRate(): Promise<number> {
    try {
      const xmlData = await this.getXMLdata();
      const interestRate = this.parseXML(xmlData);
      console.debug('TIPS rate fetched:', interestRate);
      return interestRate;
    } catch (err) {
      console.error('Error fetching TIPS rate:', err);
      return 0;
    }
  }

  private getXMLdata(): Promise<string> {
    const url = this.createURLstring();
    return this.http.get(url, { responseType: 'text' }).toPromise();
  }

  private createURLstring(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const monthString = month < 10 ? `0${month}` : month.toString();

    // Direct Treasury URL; Scully will fetch at build time
    return `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml/daily_treasury_real_yield_curve?field_tdr_date_value_month=${year}${monthString}`;
  }

  private parseXML(xmldata: string): number {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      trimValues: true
    });
    const result = parser.parse(xmldata) as any;
    const entries = result.feed?.entry;
    if (!entries || entries.length === 0) return 0;

    const lastEntry = entries[entries.length - 1];
    const properties = lastEntry?.content?.['m:properties'];
    if (!properties || !properties['d:TC_20YEAR']) return 0;

    const rateValue = properties['d:TC_20YEAR']['#text'];
    const interestRate = Number(rateValue);
    return isNaN(interestRate) ? 0 : interestRate;
  }
}
