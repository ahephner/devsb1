import { LightningElement, wire } from 'lwc';
import { APPLICATION_SCOPE,MessageContext, publish, subscribe, unsubscribe} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
export default class UpdateTable extends LightningElement {
    updateExposed = false;
    subscritption = null; 
    upProdTable = false;
    
    @wire(MessageContext)
    messageContext; 
//subscribe to message channel
    subscribeToMessage(){
        if(!this.subscritption){
            console.log('listening');
            
            this.subscritption = subscribe(
                this.messageContext,
                Program_Builder,
                (message) => this.handleMessage(message),
                {scope: APPLICATION_SCOPE}
            );
        }
    }
//handle the message
//then call get the area info for the product conversions 
    handleMessage(message){
        //console.log('handling ' +message.connector);
        this.updateExposed = message.updateProdTable;
        this.appId = message.appId; 
        this.upProdTable = true; 
    }
//life cycle hooks
    unsubscribeFromMessageChannel(){
            unsubscribe(this.subscritption);
            this.subscritption = null; 
    }

    connectedCallback(){
        this.subscribeToMessage();
    }
    disconnectedCallback(){
        this.unsubscribeFromMessageChannel(); 
    }

    closeModal(){
        this.updateExposed = false; 
    }
}