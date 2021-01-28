import { LightningElement, wire } from 'lwc';
import { APPLICATION_SCOPE,MessageContext, publish, subscribe, unsubscribe} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
/* https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reference_salesforce_modules */
export default class ProductTable extends LightningElement {
    exposed = false;
    searchKey; 
    subscritption = null; 
    pf;
    cat; 
    @wire(MessageContext)
        messageContext; 
//subscribe to message channel
        subscribeToMessage(){
            if(!this.subscritption){
                this.subscritption = subscribe(
                    this.messageContext,
                    Program_Builder,
                    (message) => this.handleMessage(message),
                    {scope: APPLICATION_SCOPE}
                );
            }
        }
//handle the message
        handleMessage(message){
            console.log('handling ' +message.connector);
            this.exposed = message.connector;
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

    searchProd(event){
        console.log(event.detail); 
        console.log(event.target.value)
    }
//get set new product family/category search
    get pfOptions(){
        return [
            {label: 'ph', value:'ph'}
        ]
    }
    pfChange(event){
        this.pf = event.detail.value; 
    }

    get catOptions(){
        return [
            {label: 'Herbicide', value:'Chemicals-Herbicide'},
            {label: 'Fungicide', value:'Chemicals-Fungicide'},
            {label: 'Insecticide', value:'Chemicals-Insecticide'},
            {label: 'PGR', value:'Chemicals-Growth Regulator'}, 
        ]
    }
    catChange(e){
        this.cat = e.detail.value; 
    }
//close modal
    closeModal(){
        this.exposed = false; 
    }
}
