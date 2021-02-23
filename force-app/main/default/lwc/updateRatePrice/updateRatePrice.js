import { LightningElement, api } from 'lwc';
import appProducts from '@salesforce/apex/appProduct.appProducts'; 
export default class UpdateRatePrice extends LightningElement {
    @api appId; 
    appName; 
    appDate; 
    updateAppId;
    areaId; 
    areaName;
    prodlist;
    error; 
    loaded=false; 
    areaSize;
    appTotalPrice; 
    connectedCallback(){
        this.loadProducts();
        console.log('calling') 
    }
    get unitArea(){
        return [
            {label:'OZ/M', value:'OZ/M'}, 
            {label: 'OZ/Acre', value:'OZ/Acre'},
            {label: 'LB/M', value:'LB/M'},
            {label: 'LB/Acre', value:'LB/Acre'}
        ];
    }

    loadProducts(){
        appProducts({app: this.appId})
        .then((resp)=>{
            console.log('running '+resp);
            this.loaded = true; 
            this.prodlist = resp;
            // console.log('test ' +resp[0].Application__r.Name);
            
            // resp.forEach(element => {
            //     console.log(element);
                
            // });
            this.appName = resp[0].Application__r.Name;
            this.appDate = resp[0].Application__r.Date__c; 
            this.updateAppId = resp[0].Application__c; 
            this.areaId = resp[0].Application__r.Area__c
            this.areaName = resp[0].Area__c 
//need for doing math later
            this.areaSize= parseInt(resp[0].Application__r.Area__r.Area_Sq_Feet__c)
            this.appTotalPrice = this.newProds.map(el=> el.Total_Price__c).reduce(this.appTotal)
            
        }).catch((error)=> {
            this.error = error;
            console.log('error '+this.error);
            
        })
    }

    cancel(){
        this.dispatchEvent(new CustomEvent('cancel'))
    }
}