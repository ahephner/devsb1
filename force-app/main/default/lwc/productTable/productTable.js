import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { APPLICATION_SCOPE,MessageContext, publish, subscribe, unsubscribe} from 'lightning/messageService';
import Program_Builder from '@salesforce/messageChannel/Program_Builder__c';
import areaInfo from '@salesforce/apex/appProduct.areaInfo';
import addApplication from '@salesforce/apex/addApp.addApplication';
import addProducts from '@salesforce/apex/addApp.addProducts';
import multiInsert from '@salesforce/apex/addApp.multiInsert';
import {pref} from 'c/programBuilderHelper';
//this gets the avaliable price books must pass account id
import getPriceBooks from '@salesforce/apex/getPriceBooks.getPriceBookIds';
//this returns either a set of price book id's or array of objects of all the avaliable price books for the account in order of priority. Standard is always there
import { priorityPricing} from 'c/helperOMS';

/* https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.reference_salesforce_modules */
export default class ProductTable extends LightningElement {
    //controls what component is up
    exposed = false;
    dateName = false;
    productList = false; 
    productRates = false;
    subscritption = null;
    disableBtn = false; 
    //firstApp = true; 
    //searching product table 
    areaSelected;
    areaId;  
    ornamental; 
    count = 0; 
    //App Info
    appName;
    appDate;
    interval;
    numbApps;
    daysApart;
    customInsert = false; 
    currentStage = 'appInfo'
    applicationNote; 
    dropShip;
    accId; 
    //if an application is the first of a multi-insert
    parApp; 
    //tank size and volume
    tankSize;
    totalSprayVol;
    sprayMeasurement; 
   @track selectedProducts = []; 

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
//then call get the area info for the product conversions 
        handleMessage(message){
            //console.log('handling ' +message.connector);
            this.exposed = message.connector;
            this.areaSelected = message.message; 
            this.dateName = true;
            this.areaId = message.areaId;
            this.accId = message.accountId; 
            //control flow for when trying to call refresh apex
            //if an issue look at the reset below I changed to undefined used to be ''
            if(this.areaId){
               this.handleArea(this.areaId);
               
            }
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
        move(stage){
            stage = this.currentStage;
            if(!this.ornamental){
                switch(stage){
                    case 'appInfo':
                        let go = this.template.querySelector('c-app-name-date').next();
                        go ? this.currentStage = 'selectProd' : '';
                        break;
                    case 'selectProd':
                        let ok = this.template.querySelector('c-app-select-prod').next();
                        
                        ok ? this.currentStage = 'ratePrice' :'';
                        console.log(this.currentStage)
                        break;
                    case 'ratePrice':
                        let final = this.template.querySelector('c-app-rate-price').save();
                        final ? this.currentStage = 'appInfo': '';
                        break;
                    default:
                        break;
                }
            }else{
                switch(stage){
                    case 'appInfo':
                        let go = this.template.querySelector('c-app-name-date').next();
                        go ? this.currentStage = 'ornSelectProd' : '';
                        break;
                    case 'ornSelectProd':
                        let ok = this.template.querySelector('c-app-select-prod').next();
                        
                        ok ? this.currentStage = 'ornRatePrice' :'';
                        console.log(this.currentStage)
                        break;
                    case 'ornRatePrice':
                        let final = this.template.querySelector('c-orn-app-rate-price').save();
                        final ? this.currentStage = 'appInfo': '';
                        break;
                    default:
                        break;
                }
            }       
        }
    //pricebooks in order. because the helper returns a set() you need to spread out to array. 
    pbIds; 
        //get area info for the product calculations
       async handleArea(x){  
            let resp = await areaInfo({ai:x})
            let priceBooks = await getPriceBooks({accountId: this.accId});
            let pbInfo = await priorityPricing(priceBooks);
            //returns a SET() need to spread them out into an array before passing over. 
                this.pbIds = [...pbInfo.priceBookIdArray]; 
                this.areaSQft = resp[0].Area_Sq_Feet__c
                this.areaUM = resp[0].Pref_U_of_M__c
                this.ornamental = resp[0].Pref_U_of_M__c === '100 Gal' ? true : false; 
                this.sprayVol = resp[0].Required_Gallons__c;
            
            }
//how to call a function from a child comp. if tracking values in parent 
    // search(){
    //      //this.template.querySelector('c-app-product-list').searchProd(this.searchKey, this.pf, this.cat);
    //      this.template.querySelector('c-app-select-prod').searchProd(this.searchKey, this.pf, this.cat);   
    // }

//close modal
    closeModal(){
        this.exposed = false; 
        //for now I have to turn both off. May make sense to either A. clear all values in the components first
        this.dateName = false;
        this.productList = false; 
        this.productRates = false; 
        this.currentStage = 'appInfo'; 
    }
    nextProdList(){
        this.dateName = false;
        this.productList = true; 
    }

    //set Name Date get values from appNameDate
    setNameDate(mess){
        this.appName = mess.detail.name;
        this.appDate = mess.detail.date;
        this.numbApps = mess.detail.numb;
        this.interval = mess.detail.spread;
        this.dateName = false;
        this.productList = true; 
        this.parApp = mess.detail.spread != 'once'? true : false;  
    }

    //gathers products from appSelectProd then maps over to set values for the appRatePrice that are need for the math functions
    //the pref uses the above function to set the unit of measure automatically for the user
    gatherProducts(mess){
        this.productList = false;
        this.productRates = true; 
        
         this.selectedProducts = mess.detail.map(item=>{
            
            return {...item,
               Product__c: item.Product__c,
               Product_Name__c: item.Name,   
               Rate2__c: 0,
               Application__c: '',
               Note__c: '' ,
               Units_Required__c: 1,
               Unit_Area__c: pref(this.areaUM, item.Product_Type__c),  
               Unit_Price__c: item.agency ? item.floorPrice : item.UnitPrice,
               Unit_Cost__c: item.unitCost, 
               altPriceBookId__c: item.alt_PB_Id,
               altPriceBookName__c: item.alt_PB_Name,
               altPriceBookEntryId__c: item.alt_PBE_Id,
               Margin__c: item.agency ? "" : item.margin, 
               Total_Price__c: item.agency ? item.floorPrice : item.UnitPrice,
               size: item.size,
               allowEdit: item.agency ? true : false,
               Area__c: '',
               isFert: item.isFert,
               galLb: item.galWeight,
               btnLabel:'Add Note',
               btnValue: 'Note',
               showNote: false,
               Spray_Vol_M__c: '',
               unitAreaStyles: 'slds-col slds-size_2-of-12', 
               isLowVol__c:false, 
               costM:'',
               costA:'',
               url: item.labelURL,
               Note_Other__c:'', 
               Manual_Charge_Size__c: 0,
               url: item.labelURL,
               sprayVolume: this.ornamental ? this.sprayVol: 0,
               Cost_per_100__c:'',
               Cost_per_Gallon__c:'', 
               manCharge: item.Name.toLowerCase().includes('manual charge')
            }
        } );
       console.log(this.selectedProducts)
    }
    save(prod){ 
        //catching values from appRatePrice. It's an array that you can get values using [1]
        this.selectedProducts = prod.detail[0]; 
        this.applicationNote = prod.detail[1]; 
        this.dropShip = prod.detail[2];
        this.tankSize = prod.detail[3];
        this.sprayMeasurement = prod.detail[4]; 
        this.totalSprayVol = prod.detail[5];
        let params = {
            appName: this.appName,
            appArea: this.areaId,
            appDate: this.appDate,
            appNote: this.applicationNote,
            parentApp: this.parApp,
            ds: this.dropShip,
            tankSize: this.tankSize,
            measurement: this.sprayMeasurement,
            volume: this.totalSprayVol
        }
        addApplication({wrapper:params})
            .then((resp)=>{
                this.appId = resp.Id;
                this.selectedProducts.forEach((x)=> x.Application__c = this.appId)
                let products = JSON.stringify(this.selectedProducts);
                console.log('products '+products);

                addProducts({products:products})
                    .then(()=>{
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Application created '+ this.appName,
                                variant: 'success',
                            }),
                        );      
                    }).then(()=>{
                        //console.log('interval '+this.interval);
                        
                        if(this.interval !='once'){
                            multiInsert({appId:this.appId, occurance:this.numbApps, daysBetween: this.interval})
                        }
                    }).then(()=>{
                        this.appName = '';
                        //this may be an issue was = ''; 
                        this.areaId = undefined;
                        this.appDate = '';
                        this.selectedProducts = [];
                        //console.log('sending '+ payload.updateTable);
                        
                    }).then(()=>{
                        //this.firstApp = true;
                        const payload = {
                            updateTable: true
                        }
                        publish(this.messageContext, Program_Builder, payload); 
                        this.closeModal(); 

                    }).catch((error)=>{
                        console.log(JSON.stringify(error))
                        let message = 'Unknown error';
                        if (Array.isArray(error.body)) {
                            message = error.body.map(e => e.message).join(', ');
                        } else if (typeof error.body.message === 'string') {
                            message = error.body.message;
                        }
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error loading contact',
                                message,
                                variant: 'error',
                            }),
                        );
                        this.closeModal(); 
                    })
            })

         
    }

    badPrice(prod){
        this.disableBtn = prod.detail;
    }
}