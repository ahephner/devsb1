import { LightningElement, wire } from 'lwc';
import { APPLICATION_SCOPE,MessageContext, publish, subscribe, unsubscribe} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import addProducts from '@salesforce/apex/addApp.addProducts';
export default class UpdateTable extends LightningElement {
    updateExposed = false;
    loaded = false; 
    subscritption = null; 
    upProdTable = false;
    addProduct = false; 
    appId; 
    selectedProducts = [];
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
        console.log('handling ' +message.addProd);
        this.updateExposed = message.updateProdTable;
        this.appId = message.appId; 
        this.upProdTable = message.updateProd; 
        this.addProduct = message.addProd; 
        this.loaded = true;
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

    handleProds(mess){
        this.addProduct = false;
        this.addPrice = true; 
        this.selectedProducts = mess.detail.map(item=>{
            return {...item, 
               Rate2__c: 0,
               Application__c: this.appId,
               Note__c: '' ,
               Units_Required__c: '0',
               Unit_Area__c: '',  
               Unit_Price__c: "0",
               Margin__c: "0", 
               Total_Price__c: "0",
               Area__c: ''
            }
        });    
    }

    save(products){
        this.loaded = false; 
        const prod = JSON.stringify(products.detail);
        
        addProducts({products:prod})
            .then(()=>{
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Application created '+ this.appName,
                        variant: 'success',
                    }),
                );
                this.addPrice = false; 
                this.selectedProducts = [];
                this.closeModal();
            }).catch((error)=>{
                console.log(JSON.stringify(error))
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error adding app',
                        message: JSON.stringify(error),
                        variant: 'error'
                    }) 
                ) 
                this.addPrice = false; 
                this.selectedProducts = [];
                this.closeModal(); 
            })
    }

 


    closeModal(){
        this.updateExposed = false; 
    }
}