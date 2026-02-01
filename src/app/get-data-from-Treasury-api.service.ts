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

    // Direct Treasury URL; Scully will fetch at build time
    return `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xmlview?data=daily_treasury_real_yield_curve&field_tdr_date_value=${year}`;
  }

  private parseXML(xmldata: string): number {
    // The API returns XML wrapped in HTML <pre> tags, so extract the XML first
    const preMatch = xmldata.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    const actualXml = preMatch ? preMatch[1] : xmldata;

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      removeNSPrefix: true,
      trimValues: true
    });
    const result = parser.parse(actualXml) as any;
    // Entry can be at result.feed.entry or directly at result.entry
    const entries = result.feed?.entry || result.entry;
    // Ensure entries is an array
    const entryArray = Array.isArray(entries) ? entries : (entries ? [entries] : []);
    if (entryArray.length === 0) return 0;

    const lastEntry = entryArray[entryArray.length - 1];
    const properties = lastEntry?.content?.properties;
    if (!properties || !properties['TC_20YEAR']) return 0;

    const tc20year = properties['TC_20YEAR'];
    // Handle both direct value and object with #text property
    const rateValue = typeof tc20year === 'object' ? tc20year['#text'] : tc20year;
    const interestRate = Number(rateValue);
    return isNaN(interestRate) ? 0 : interestRate;
  }
}
