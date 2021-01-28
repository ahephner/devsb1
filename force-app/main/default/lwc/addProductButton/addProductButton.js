import { LightningElement, wire } from 'lwc';
import { MessageContext, publish} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
/* https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reference_salesforce_modules */
export default class AddProductButton extends LightningElement {
    
    @wire(MessageContext)
        messageContext; 
    
    openModal(){
        console.log('open modal');
        
        const payload = {
            connector: true
        }
        publish(this.messageContext, Program_Builder, payload); 
    }
}