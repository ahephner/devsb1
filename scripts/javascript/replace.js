import { priorityPricing} from 'c/helperOMS';
 import getPriceBooks from '@salesforce/apex/getPriceBooks.getPriceBookIds';
import basicInfo from '@salesforce/apex/appProduct.basicInfo';
import priorityPrice from '@salesforce/apex/getPriceBooks.priorityBestPrice'; 
pbIds; 
accId; 
connectedCallBack(){
    this.init(); 
}

async init(){
    let info = await basicInfo({programId: this.recordId})
    this.accId = info[0].Program__r.Account__c; 
    //neeed to get account id, price book ids
    let priceBooks = await getPriceBooks({accountId: this.accId});
    let pbInfo = await priorityPricing(priceBooks);
    this.pbIds = [...pbInfo.priceBookIdArray]; 
}

async clickProduct(prodId){
        let priceInfo = await priorityPrice({priceBookIds: this.pbIds, productId: prodId})
        
}