import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { XMLParser } from 'fast-xml-parser';

@Injectable({
  providedIn: 'root'
})
export class GetDataFromTreasuryAPIService {

  constructor(private http: HttpClient) {
    this.getInterestRate(); // Optional: can remove if you want to call manually
  }

  // Fetch the latest 20-year TIPS rate
  async getInterestRate(): Promise<number> {
    try {
      const xmlData = await this.getXMLdata();
      const interestRate = this.parseXML(xmlData);
      
      if (!isNaN(interestRate)) {
        console.debug('TIPS rate fetched:', interestRate);
      } else {
        console.warn('Parsed TIPS rate is NaN.');
      }

      return interestRate;
    } catch (err) {
      console.error('Error fetching TIPS rate:', err);
      return 0; // fallback
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
    return `/api/treasury?data=daily_treasury_real_yield_curve&field_tdr_date_value_month=${year}${monthString}`;
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

    // The TIPS rate value is stored under #text
    const rateValue = properties['d:TC_20YEAR']['#text'];
    const interestRate = Number(rateValue);

    return isNaN(interestRate) ? 0 : interestRate;
  }
}
