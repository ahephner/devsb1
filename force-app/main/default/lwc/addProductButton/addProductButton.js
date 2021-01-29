import { LightningElement, wire, api } from 'lwc';
import getAreas from '@salesforce/apex/appProduct.getAreas';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import {refreshApex} from '@salesforce/apex';
import { MessageContext, publish} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
/* https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reference_salesforce_modules */
export default class AddProductButton extends LightningElement {
    @api recordId; 
    area
    titleText = 'Area Selected ';;
   selectedLabel
    @wire(MessageContext)
        messageContext; 
    
    @wire(getAreas, {recordId: '$recordId'})
        areaList
    //get area options
    get areaOptions(){
        //console.log('recordId '+this.recordId);
        
        return this.areaList.data; 
    }
    //used to select area plus alert the user in the comp. Will use this to verify an area was set before products added
    selectArea(e){
        this.area = e.detail.value; 
        //areaName = e.target.areaOptions.find(opt => opt.value === e.detail.value).label; 
        //Wrong I was trying to call my areaOptions not what the system has as target.options
        this.selectedLabel = e.target.options.find(opt => opt.value === e.detail.value).label;
        this.titleText += this.selectedLabel        
    }

    newArea(){
        //open appModal -- parent to child comm example 
        this.template.querySelector('c-app-modal').openMe();
        
    }

    openModal(){
        //open productTable if area is selected
        if(this.area){
            const payload = {
                connector: true
            }
            publish(this.messageContext, Program_Builder, payload); 
       }else{
           this.dispatchEvent(
               new ShowToastEvent({
                   title: 'Hold on',
                   message: 'Please first select an area',
                   variant: 'error',
               })
           )
           
       }
    }


    addedOption(){
        //console.log('dad listening');
        //listen for the child -> appModal to send parent new area has been added
        return refreshApex(this.areaList)
    }
}