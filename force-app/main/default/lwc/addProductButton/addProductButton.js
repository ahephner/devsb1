import { LightningElement, wire, api } from 'lwc';
import getAreas from '@salesforce/apex/appProduct.getAreas';
import {refreshApex} from '@salesforce/apex';
import { MessageContext, publish} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
/* https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reference_salesforce_modules */
export default class AddProductButton extends LightningElement {
    @api recordId; 
    area
    @wire(MessageContext)
        messageContext; 
    
    @wire(getAreas, {recordId: '$recordId'})
        areaList
    //get area options
    get areaOptions(){
        //console.log('recordId '+this.recordId);
        
        return this.areaList.data; 
    }
    
    selectArea(e){
        this.area = e.detail.value; 
        //console.log('area ' + this.area);    
    }

    newArea(){
        console.log('clicked');
        
    }

    openModal(){
        console.log('open modal');
        
        const payload = {
            connector: true
        }
        publish(this.messageContext, Program_Builder, payload); 
    }
}