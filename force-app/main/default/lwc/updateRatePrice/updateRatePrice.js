import { LightningElement, api, track, wire } from 'lwc';
import appProducts from '@salesforce/apex/appProduct.appProducts'; 
import getPricing from '@salesforce/apex/appProduct.pricing';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import updateApplication from '@salesforce/apex/addApp.updateApplication';
import updateProducts from '@salesforce/apex/addApp.updateProducts';
import multiUpdateProd from '@salesforce/apex/addApp.multiUpdateProd';
import { getObjectInfo, getPicklistValues} from 'lightning/uiObjectInfoApi';
import PRODUCT_OBJ from '@salesforce/schema/App_Product__c';
import NOTE from '@salesforce/schema/App_Product__c.Note__c';
import { appTotal, alreadyAdded, pref,calcDryFert, calcLiqFert, unitsRequired, roundNum, pricePerUnit, perProduct, merge, areaTreated, sumFert, totalUsed,lowVolume, lvUnits } from 'c/programBuilderHelper';
import {checkPricing, sumByKey} from 'c/helper'
export default class UpdateRatePrice extends LightningElement {
    @api appId; 
    appName; 
    appDate; 
    updateAppId;
    areaId; 
    areaName;
    accountId; 
    @track prodlist;
    error; 
    loaded=false; 
    areaSizeM;
    areaAcres
    @track appTotalPrice = 0.00;
    sqft
    programId; 
    area
    areaUM
    measure = 'M'; 
    addMore = false; 
    //for showing area size
    showAcreSize
    //For showing product information
    productName = '';
    productCost = 0;
    treatedAcreage;
    appTotalN = 0.00;
    appTotalP = 0.00;
    appTotalK = 0.00;
    levelOne;
    levelTwo;
    prodFloor;
    showProdInfo;
    prodCostM;
    prodCostA; 
    totalCostPerM = 0;
    totalCostPerAcre = 0;
    prodAreaCost = 0;
    goodPricing = true;
    noteOps;
    dropShipCheck; 
    isDropShip; 
    tankSize;
    sprayMeasure
    spraySize;
    //Here is notes per app
    //The wasNewNote note is a boolean that will indicate to apex cont to update note field or not
    wasNewNote = false; 
    oppNote
    multiApp; 
    parentApp; 
    updateMulti = false;
    @track productIds = [];

    connectedCallback(){
        this.loadProducts();
        //console.log('calling') 
    }
    get unitArea(){
        return [
            {label:'OZ/M', value:'OZ/M'}, 
            {label: 'OZ/Acre', value:'OZ/Acre'},
            {label: 'LB/M', value:'LB/M'},
            {label: 'LB/Acre', value:'LB/Acre'},
            {label:'100 Gal', value:'100 Gal'}
        ];
    }
        //need this to get picklist
        @wire(getObjectInfo, { objectApiName: PRODUCT_OBJ })
        objectInfo;

    //get sub category picklist
    @wire(getPicklistValues, {
        recordTypeId: "$objectInfo.data.defaultRecordTypeId",
        fieldApiName: NOTE
      })
      noteOps;
 
       async loadProducts(){
        try{
            let prodIds = new Set();
            this.loaded = false;
            let firstLoad = await appProducts({app: this.appId});
            let nonPrice = firstLoad.map(item =>{
                                let allowEdit = item.Product__r.Agency_Pricing__c ? item.Product__r.Agency_Pricing__c : item.Product__r.Agency_Pricing__c
                                let nVal = item.Product__r.N__c;
                                let pVal = item.Product__r.P__c;
                                let kVal = item.Product__r.K__c;
                                let Product_Type__c = item.Product__r.Product_Type__c; 
                                let isFert = item.Product__r.hasFertilizer__c;
                                let title = `Unit Price - Flr $${item.Product__r.Floor_Price__c}`; 
                                let galLb = item.Product__r.X1_Gallon_Weight__c
                                let costM;
                                let costA;
                                // let altPriceBookId__c = item.altPriceBookId__c;
                                let altPriceBookName__c = item.altPriceBookName__c;
                                // let altPriceBookEntryId__c = item.altPriceBookEntryId__c; 
                                let goodPrice = true; 
                                let showNote = false;
                                let unitAreaStyles = item.isLowVol__c ? 'slds-col slds-size_2-of-12 lowVolume' : 'slds-col slds-size_2-of-12';
                                let agencyProd = item.Product__r.Agency_Pricing__c; 
                                let btnLabel = 'Add Note';
                                let btnValue = 'Note';
                                let totalUsed = item.Total_Used_f__c;
                                let  manCharge =  item.Product_Code__c.toLowerCase().includes('manual charge')
                                let Note_Other__c = item.Note_Other__c;
                                let Product_SDS_Label__c = item.Product__r.Website_Label__c
                                let prevAppId = item.Application__r.Prev_App_Id__c != undefined ? item.Application__r.Prev_App_Id__c : item.Application__c; 
                                this.appTotalPrice += item.Total_Price__c;
                                //console.log(typeof item.N__c);
                                this.appTotalN += item.N__c;
                                this.appTotalP += item.P__c;
                                this.appTotalK += item.K__c;
                                //used for updating. Pushing id to a list so when something is updated we check against it
                                prodIds.add(item.Product__c);
                                return {...item, allowEdit, nVal, pVal, kVal, Product_Type__c, isFert, title, galLb, costM,costA, goodPrice, showNote, unitAreaStyles, agencyProd, altPriceBookName__c, btnLabel,Product_SDS_Label__c, btnValue, totalUsed, manCharge, Note_Other__c, prevAppId}
                            });
                            let idList = [...prodIds]
                            let pricing = await getPricing({ids: idList });
                            this.prodlist = await merge(nonPrice, pricing);
                            //console.log(JSON.stringify(this.prodlist))
                            //get your app and area info for the pop up screen
                            this.accountId = this.prodlist[0].Application__r.Area__r.Program__r.Account__c
                            this.appName = this.prodlist[0].Application__r.Name;            
                            this.appDate = this.prodlist[0].Application__r.Date__c;             
                            this.updateAppId = this.prodlist[0].Application__c;            
                            this.programId = this.prodlist[0].Application__r.Program_ID__c;
                            this.areaId = this.prodlist[0].Application__r.Area__c           
                            this.areaName = this.prodlist[0].Area__c            
                            this.areaUM = this.prodlist[0].Application__r.Area__r.Pref_U_of_M__c; 
                            this.oppNote = this.prodlist[0].Application__r.Note__c;
                            this.multiApp = this.prodlist[0].Application__r.Multi_Application__c; 
                            this.parentApp = this.prodlist[0].Application__r.Parent_Application__c;
                            this.dropShipCheck = this.prodlist[0].Application__r.Direct_Ship__c ? true:false;              
                            this.isDropShip = this.prodlist[0].Application__r.Direct_Ship__c;
                            this.tankSize = this.prodlist[0].Application__r.Tank_Size__c;
                            this.sprayMeasure = this.prodlist[0].Application__r.Spray_Vol_Meas__c;
                            this.spraySize = this.prodlist[0].Application__r.Spray_Vol__c;
    //need for doing math later
                this.areaSizeM= roundNum(parseFloat(this.prodlist[0].Application__r.Area__r.Area_Sq_Feet__c),2);
                this.areaAcres = roundNum(parseFloat(this.prodlist[0].Application__r.Area__r.Area_Acres__c),2);
    //Round totals
                this.appTotalN = roundNum(this.appTotalN, 4);
                this.appTotalP = roundNum(this.appTotalP, 4);
                this.appTotalK = roundNum(this.appTotalK, 4);
                
                this.showAcreSize = this.areaUM.includes('Acre') ? true : false; 
                //this.totalCostPerM = roundNum(this.appTotalPrice/(this.areaSizeM/1000),2); 
                this.totalCostPerM = roundNum(Object.values(this.prodlist).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                this.loaded = true;
        } catch (error) {
            console.error(error);
            const evt = new ShowToastEvent({
                title: 'Error on load..',
                message: error,
                variant: 'error'
            });
            this.dispatchEvent(evt); 
        }
    }
    

    @api
    addProducts(){
        this.addMore = true; 
    }
    @api
    closeAdd(){
        this.addMore = false; 
    }
//updating value functions below
        newAppName(e){
            this.appName = e.detail.value;
        }

        newAppDate(e){
            this.appDate = e.detail.value; 
        }
        showAreaSize(){
            this.showAcreSize = this.showAcreSize === true ? false : true; 
        }

//get new rate for the product
         newRate(e){
            let index = this.prodlist.findIndex(prod => prod.Product_Code__c === e.target.name);
            
            window.clearTimeout(this.delay);
             // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.delay = setTimeout(()=>{
                this.prodlist[index].Rate2__c = Number(e.detail.value);
                //console.log('ua '+this.prodlist[index].Unit_Area__c);
                
                if(this.prodlist[index].Unit_Area__c != '' && this.prodlist[index].Unit_Area__c != null && this.prodlist[index].Unit_Area__c != '100 Gal' ){
                    this.prodlist[index].Units_Required__c = unitsRequired(this.prodlist[index].Unit_Area__c, this.prodlist[index].Rate2__c, this.areaSizeM, this.prodlist[index].Product_Size__c )    
                    this.prodlist[index].totalUsed = totalUsed(this.prodlist[index].Unit_Area__c, this.areaSizeM, this.prodlist[index].Rate2__c);
                    this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c, 2);
                    this.appTotalPrice = appTotal(this.prodlist)
                    //this.totalCostPerM = roundNum(this.appTotalPrice/(this.areaSizeM/1000),2); 
                    let costs = perProduct(this.prodlist[index].Total_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c);
                    let prodCost = pricePerUnit(this.prodlist[index].Unit_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c,this.prodlist[index].Unit_Area__c);
                    this.prodlist[index].Cost_per_M__c = prodCost.perThousand;
                    this.prodlist[index].Cost_per_Acre__c = prodCost.perAcre; 
                    this.totalCostPerM = roundNum(Object.values(this.prodlist).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                    //this.prodCostM = costs.perThousand;
                    this.prodCostM = this.prodlist[index].Cost_per_M__c; 
                    this.prodCostA = this.prodlist[index].Cost_per_Acre__c;
                    this.prodAreaCost = this.areaAcres * this.costPerAcre; 
                    this.treatedAcreage = areaTreated(this.prodlist[index].Product_Size__c,this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c ); 
                    this.productIds.includes(this.prodlist[index].Product__c) ? '': this.productIds.push(this.prodlist[index].Product__c);
                    //console.log(1,this.prodlist[index].Unit_Area__c,2, this.prodlist[index].Rate2__c, 3,this.areaSizeM,4, this.prodlist[index].Product_Size__c)
                    if(this.prodlist[index].isFert){
                        let fert = this.prodlist[index].Product_Type__c === 'Dry' ? calcDryFert(this.prodlist[index].Rate2__c, this.prodlist[index]) : calcLiqFert(this.prodlist[index].Rate2__c, this.prodlist[index]);
                        this.prodlist[index].N__c = fert.n;
                        this.prodlist[index].P__c = fert.p;
                        this.prodlist[index].K__c = fert.k;
                        let totalFert = sumFert(this.prodlist)
                        this.appTotalN = roundNum(totalFert.N__c, 4);
                        this.appTotalP = roundNum(totalFert.P__c, 4);
                        this.appTotalK = roundNum(totalFert.K__c, 4);

                    }
                }else if(this.prodlist[index].Unit_Area__c ==='100 Gal'){
                    this.prodlist[index].isLowVol__c = true; 
                    this.prodlist[index].unitAreaStyles = 'slds-col slds-size_2-of-12 lowVolume'
                    this.prodlist[index].Rate2__c = Number(e.detail.value)
                    let {Rate2__c, Product_Size__c, Spray_Vol_M__c, Unit_Price__c} = this.prodlist[index];
    
                    if(Spray_Vol_M__c>0 && Rate2__c> 0){
                       
                        let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, Unit_Price__c) 
                        console.log(finished)
                        //updateValues
                        this.prodlist[index].Units_Required__c = lvUnits(this.areaSizeM, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                        this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c, 2);
                        
                         
                        this.prodlist[index].Cost_per_M__c = finished.singleThousand;
                        this.prodlist[index].Cost_per_Acre__c = finished.singleAcre;
                        this.prodlist[index].Acres_Treated__c = finished.acresTreated;
                        this.prodCostM = finished.singleThousand;
                        this.prodCostA = finished.singleAcre;
                        this.treatedAcreage = finished.acresTreated
                        //this.prodAreaCost = this.areaAcres * this.costPerAcre;
                        
                        this.appTotalPrice = appTotal(this.prodlist); 
                        this.totalCostPerM = roundNum(Object.values(this.prodlist).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                    }
    
                   }
                
            },500 ) 
           }

           handleLowVol(e){
            let index = this.prodlist.findIndex(prod => prod.Id === e.target.name);
            
            if(this.prodlist[index].Rate2__c === undefined || this.prodlist[index].Rate2__c<=0){
                return;
            }else{
                window.clearTimeout(this.delay);
                
                this.delay = setTimeout(()=>{
                    
                 let sprayVolum = Number(e.detail.value); 
                 let {Rate2__c, Product_Size__c, Unit_Price__c} = this.prodlist[index];
                 let finished = lowVolume(Rate2__c, Product_Size__c, sprayVolum, Unit_Price__c) 
                 
                 //updateValues
                 this.prodlist[index].Units_Required__c = lvUnits(this.areaSizeM, sprayVolum, Product_Size__c, Rate2__c);
                 this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c, 2);
                 
                 this.prodlist[index].Spray_Vol_M__c = sprayVolum; 
                 this.prodlist[index].Cost_per_M__c = finished.singleThousand;
                 this.prodlist[index].Cost_per_Acre__c = finished.singleAcre;
                 this.prodlist[index].Acres_Treated__c = finished.acresTreated;
                 this.prodCostM = finished.singleThousand;
                 this.prodCostA = finished.singleAcre;
                 this.treatedAcreage = finished.acresTreated
                 //this.prodAreaCost = this.areaAcres * this.costPerAcre;
                 this.treatedAcreage = finished.acresTreated
                 this.appTotalPrice = appTotal(this.prodlist); 
                 this.totalCostPerM = roundNum(Object.values(this.prodlist).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)

                },500)

            }
           }

           handleUnitArea(e){
            let index = this.prodlist.findIndex(prod => prod.Product2Id === e.target.name);
            
            this.prodlist[index].Unit_Area__c = e.detail.value;
            //show low volume or not
            this.prodlist[index].isLowVol__c = e.detail.value!= '100 Gal'? false: true;;
            this.prodlist[index].unitAreaStyles = e.detail.value!= '100 Gal' ?'slds-col slds-size_2-of-12': 'slds-col slds-size_2-of-12 lowVolume'
            
            if(this.prodlist[index].Rate2__c > 0 && e.detail.value!= '100 Gal'){
             this.prodlist[index].Units_Required__c = unitsRequired(this.prodlist[index].Unit_Area__c, this.prodlist[index].Rate2__c, this.areaSizeM, this.prodlist[index].Product_Size__c );
             this.prodlist[index].totalUsed = totalUsed(this.prodlist[index].Unit_Area__c, this.areaSizeM, this.prodlist[index].Rate2__c);
             this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c, 2);

             let costs = perProduct(this.prodlist[index].Total_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c);
             let prodCost = pricePerUnit(this.prodlist[index].Unit_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c,this.prodlist[index].Unit_Area__c);
             this.prodlist[index].Cost_per_M__c = prodCost.perThousand;
             this.prodlist[index].Cost_per_Acre__c = prodCost.perAcre; 

             //this.prodCostM = costs.perThousand;
             this.prodCostM = prodCost.perThousand;
            
             this.prodCostA = costs.perAcre;
             this.prodAreaCost = this.areaAcres * this.costPerAcre; 
             
             this.treatedAcreage = areaTreated(this.prodlist[index].Product_Size__c,this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c );
             
             this.appTotalPrice = appTotal(this.prodlist);
             //this.totalCostPerM = roundNum(this.appTotalPrice/(this.areaSizeM/1000),2); 
             this.totalCostPerM = roundNum(Object.values(this.prodlist).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
             this.productIds.includes(this.prodlist[index].Product__c) ? '': this.productIds.push(this.prodlist[index].Product__c);
            //handle updating fertilizer amounts
             if(this.prodlist[index].isFert){
                let fert = this.prodlist[index].Product_Type__c === 'Dry' ? calcDryFert(this.prodlist[index].Rate2__c, this.prodlist[index]) : calcLiqFert(this.prodlist[index].Rate2__c, this.prodlist[index]);
                this.prodlist[index].N__c = fert.n;
                this.prodlist[index].P__c = fert.p;
                this.prodlist[index].K__c = fert.k;
                //get totals
                let totalFert = sumFert(this.prodlist)
                this.appTotalN = roundNum(totalFert.N__c, 4);
                this.appTotalP = roundNum(totalFert.P__c, 4);
                this.appTotalK = roundNum(totalFert.K__c, 4);
            }
            }else if(e.detail.value ==='100 Gal'){
                let {Rate2__c, Product_Size__c, Unit_Price__c, Spray_Vol_M__c, Cost_per_Acre__c} = this.prodlist[index];
                if(Spray_Vol_M__c>0 && Rate2__c> 0){
                     let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, Unit_Price__c) 
                
                    //updateValues
                     this.prodlist[index].Units_Required__c = lvUnits(this.areaSizeM, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                     this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c, 2); 

                     this.prodlist[index].Cost_per_M__c = finished.singleThousand;
                     this.prodlist[index].Cost_per_Acre__c = finished.singleAcre;
                     this.prodCostM = finished.singleThousand;;
                     this.prodCostA = finished.singleAcre;
                     //this.prodAreaCost = this.areaAcres * this.costPerAcre;
                     this.treatedAcreage = finished.acresTreated;
                     this.appTotalPrice = appTotal(this.prodlist); 
                     this.totalCostPerM = roundNum(Object.values(this.prodlist).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                }
            }
        }



        
           lineTotal = (units, charge)=> (units * charge).toFixed(2);
           newPrice(e){
            window.clearTimeout(this.delay);
            let index = this.prodlist.findIndex(prod => prod.Product2Id === e.target.name);
            let targetId = e.target.name; 

            this.delay = setTimeout(()=>{
                
                this.prodlist[index].Unit_Price__c = Number(e.detail.value);
                //console.log(typeof this.prodlist[index].Unit_Price__c +' unit Type');          
                    
                    if(this.prodlist[index].Unit_Price__c > 0 && this.prodlist[index].Unit_Area__c != '100 Gal'){
                    this.prodlist[index].Margin__c = roundNum((1 - (this.prodlist[index].Product_Cost__c /this.prodlist[index].Unit_Price__c))*100,2)
                    this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c,2);
                    
                    let costs = perProduct(this.prodlist[index].Total_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c);
                    let prodCost = pricePerUnit(this.prodlist[index].Unit_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c,this.prodlist[index].Unit_Area__c);
                    
                    this.prodlist[index].Cost_per_M__c = prodCost.perThousand;
                    this.prodlist[index].Cost_per_Acre__c = prodCost.perAcre; 
                    //this.prodCostM = costs.perThousand;
                    this.prodCostM = prodCost.perThousand 
                    this.prodCostA = costs.perAcre; 
                    this.prodAreaCost = this.areaAcres * this.prodlist[index].costA; 
                    this.appTotalPrice = appTotal(this.prodlist)
                    //this.totalCostPerM = roundNum(this.appTotalPrice/(this.areaSizeM/1000),2); 
                    this.totalCostPerM = roundNum(Object.values(this.prodlist).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                    //this.handleWarning()
                }else if(this.prodlist[index].Unit_Price__c > 0 && this.prodlist[index].Unit_Area__c === '100 Gal'){
                    let {Rate2__c, Product_Size__c, Spray_Vol_M__c} = this.prodlist[index];

                    this.prodlist[index].Margin__c = roundNum((1 - (this.prodlist[index].Product_Cost__c /this.prodlist[index].Unit_Price__c))*100,2)

                    if(Spray_Vol_M__c>0 && Rate2__c> 0){
                        let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, this.prodlist[index].Unit_Price__c) 
                   
                       //updateValues
                        this.prodlist[index].Units_Required__c = lvUnits(this.areaSizeM, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                        this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c, 2); 
   
                        this.prodlist[index].Cost_per_M__c = finished.singleThousand;
                        this.prodlist[index].Cost_per_Acre__c = finished.singleAcre;
                        this.prodCostM = finished.singleThousand;;
                        this.prodCostA = finished.singleAcre;
                        //this.prodAreaCost = this.areaAcres * this.costPerAcre;
                        //this.treatedAcreage = areaTreated(this.prodlist[index].Product_Size__c,this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c );
                        this.appTotalPrice = appTotal(this.prodlist); 
                        this.totalCostPerM = roundNum(Object.values(this.prodlist).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                   }
                }else{
                    this.prodlist[index].Margin__c = 0;                
                    this.prodlist[index].Margin__c = roundNum(this.prodlist[index].Margin__c, 2);
                    this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c,2)
                    
                    let costs = perProduct(this.prodlist[index].Total_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c);
                    let prodCost = pricePerUnit(this.prodlist[index].Unit_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c,this.prodlist[index].Unit_Area__c);
                    
                    this.prodlist[index].Cost_per_M__c = prodCost.perThousand;
                    this.prodlist[index].Cost_per_Acre__c = prodCost.perAcre; 
                    
                    this.prodCostM = prodCost.perThousand 
                    this.prodCostA = costs.perAcre;
                    this.prodAreaCost = this.areaAcres * this.prodlist[index].costA; 
                    this.appTotalPrice = appTotal(this.prodlist);
                    this.totalCostPerM = roundNum(this.appTotalPrice/(this.areaSizeM/1000),2); 
                }
                let lOne = this.prodlist[index].Level_1_UserView__c;
                let floor = this.prodlist[index].Floor_Price__c;
                let unitPrice = this.prodlist[index].Unit_Price__c;
                this.productIds.includes(this.prodlist[index].Product__c) ? '': this.productIds.push(this.prodlist[index].Product__c);
                this.handleWarning(targetId,lOne, floor, unitPrice, index)
                }, 1000)
           }
           newMargin(m){
                window.clearTimeout(this.delay)
                    let index = this.prodlist.findIndex(prod => prod.Product2Id === m.target.name)
                    let targetId = m.target.name;
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    this.delay = setTimeout(()=>{
                            this.prodlist[index].Margin__c = Number(m.detail.value);
                            if(1- this.prodlist[index].Margin__c/100 > 0 && this.prodlist[index].Unit_Area__c != '100 Gal'){
                                this.prodlist[index].Unit_Price__c = roundNum(this.prodlist[index].Product_Cost__c /(1- this.prodlist[index].Margin__c/100),2);
                                this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c, 2);

                                let costs = perProduct(this.prodlist[index].Total_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c);
                                let prodCost = pricePerUnit(this.prodlist[index].Unit_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c,this.prodlist[index].Unit_Area__c);
                    
                                this.prodlist[index].Cost_per_M__c = prodCost.perThousand;
                                this.prodlist[index].Cost_per_Acre__c = prodCost.perAcre; 
                                
                                this.prodCostM = prodCost.perThousand 
                                this.prodCostA = costs.perAcre; 
                                this.prodAreaCost = this.areaAcres * this.prodlist[index].costA; 
                                
                            
                            }else if(1- this.prodlist[index].Margin__c/100 > 0 && this.prodlist[index].Unit_Area__c === '100 Gal'){
                                let {Rate2__c, Product_Size__c, Spray_Vol_M__c} = this.prodlist[index];
                                
                                this.prodlist[index].Unit_Price__c = roundNum(this.prodlist[index].Product_Cost__c /(1- this.prodlist[index].Margin__c/100),2);
                                
                                if(Spray_Vol_M__c>0 && Rate2__c> 0){
                                    let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, this.prodlist[index].Unit_Price__c) 
                               
                                   //updateValues
                                    this.prodlist[index].Units_Required__c = lvUnits(this.areaSizeM, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                                    this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c, 2); 
               
                                    this.prodlist[index].Cost_per_M__c = finished.singleThousand;
                                    this.prodlist[index].Cost_per_Acre__c = finished.singleAcre;
                                    this.prodCostM = finished.singleThousand;;
                                    this.prodCostA = finished.singleAcre;
                                    //this.prodAreaCost = this.areaAcres * this.costPerAcre;
                                    //this.treatedAcreage = areaTreated(this.prodlist[index].Product_Size__c,this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c );
                                    this.appTotalPrice = appTotal(this.prodlist); 
                                    this.totalCostPerM = roundNum(Object.values(this.prodlist).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                               }
                            }else{
                                this.prodlist[index].Unit_Price__c = 0;
                                this.prodlist[index].Unit_Price__c = roundNum(this.prodlist[index].Unit_Price__c, 2); 
                                this.prodlist[index].Total_Price__c = roundNum(this.prodlist[index].Units_Required__c * this.prodlist[index].Unit_Price__c,2);
                                
                                let costs = perProduct(this.prodlist[index].Total_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c, this.prodlist[index].Unit_Area__c);
                                let prodCost = pricePerUnit(this.prodlist[index].Unit_Price__c, this.prodlist[index].Product_Size__c, this.prodlist[index].Rate2__c,this.prodlist[index].Unit_Area__c);
                    
                                this.prodlist[index].Cost_per_M__c = prodCost.perThousand;
                                this.prodlist[index].Cost_per_Acre__c = prodCost.perAcre; 
                                
                                this.prodCostM = prodCost.perThousand 
                                this.prodCostA = costs.perAcre; 
                                this.prodAreaCost = this.areaAcres * this.prodlist[index].costA; 
                                
                                
                            }
                            this.appTotalPrice = appTotal(this.prodlist)
                            //this.totalCostPerM = roundNum(this.appTotalPrice/(this.areaSizeM/1000),2); 
                            this.totalCostPerM = roundNum(Object.values(this.prodlist).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
                            let lOne = this.prodlist[index].Level_1_UserView__c;
                            let floor = this.prodlist[index].Floor_Price__c;
                            let unitPrice = this.prodlist[index].Unit_Price__c;
                            this.productIds.includes(this.prodlist[index].Product__c) ? '': this.productIds.push(this.prodlist[index].Product__c);
                            this.handleWarning(targetId, lOne, floor, unitPrice, index)
                },1000)
            }

            prodNote(e){
                console.log(e.detail.value);
                let index = this.prodlist.findIndex(prod => prod.Product2Id === e.target.name) 
                this.prodlist[index].Note__c = e.detail.value; 
                this.productIds.includes(this.prodlist[index].Product__c) ? '': this.productIds.push(this.prodlist[index].Product__c);
            }

//Manual Line Items update. These are for products ATS does not stock 
            manName(e){
                let index = this.prodlist.findIndex(prod => prod.Id === e.target.name) 
                this.prodlist[index].Note_Other__c = e.detail.value;             
            }

            manSize(e){
                let index = this.prodlist.findIndex(prod => prod.Id === e.target.name)
                this.prodlist[index].Manual_Charge_Size__c = Number(e.detail.value); 
                this.prodlist[index].Product_Size__c = Number(e.detail.value);
                this.productIds.includes(this.prodlist[index].Product__c) ? '': this.productIds.push(this.prodlist[index].Product__c);
                if(this.prodlist[index].Rate2__c > 0){
                    this.prodlist[index].Units_Required__c = unitsRequired(this.prodlist[index].Unit_Area__c, this.prodlist[index].Rate2__c, this.areaSizeM, this.prodlist[index].Product_Size__c );
                }
            }
//remove product from app
removeProd(x){
    let index = this.prodlist.findIndex(prod => prod.Product_Code__c === x);
    let id = this.prodlist[index].Id; 
    let fert = this.prodlist[index].isFert;
    let cf = confirm('Do you want to delete this product');
    if(cf === true){
        this.prodlist.splice(index, 1);
        if(id){
        deleteRecord(id)
            .then(()=>{
                //let index = this.prodlist.findIndex(prod => prod.Product_Code__c === row);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success', 
                        message: 'Product Removed', 
                        variant: 'success'
                    }) 
                )
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error deleting record',
                        message: JSON.stringify(error),
                        variant: 'error'
                    })
                )
            })
        }
        //need to do update all values.
        this.appTotalPrice = appTotal(this.prodlist);
        //this.totalCostPerM = roundNum(this.appTotalPrice/(this.areaSizeM/1000),2);
        this.totalCostPerM = roundNum(Object.values(this.prodlist).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)
        if(fert){
            let totalFert = sumFert(this.prodlist)
            this.appTotalN += roundNum(totalFert.N__c, 4);
            this.appTotalP += roundNum(totalFert.P__c, 4);
            this.appTotalK += roundNum(totalFert.K__c, 4);
        }  
    }
    
}
//catch new prod
listenNewProd(x){
    console.log('new prod')
        const newProd = x.detail?.rowProduct ?? x.detail.Product__c;
        const alreadyThere = alreadyAdded(newProd, this.prodlist);
        if(!alreadyThere && x.detail.rowProduct != undefined){
            this.handleNewProd(x)
        }else if(!alreadyThere){
            this.handleHistoric(x);  
        }else{
            return;
        }
}

handleNewProd(x){
    //let passed = x.detail.rowProduct;
    this.prodlist = [...this.prodlist,{
        Id: '',
        Product__c: x.detail.rowProduct,
        Product_Name__c: x.detail.rowName,
        Product_Code__c: x.detail.rowCode,   
        Rate2__c: 0,
        Application__c: this.updateAppId,
        Note__c: '' ,
        Units_Required__c: 1,
        Unit_Area__c: pref(this.areaUM, x.detail.rowProdType),  
        Unit_Price__c: x.detail.rowAgency ? x.detail.rowFlrPrice : x.detail.rowUnitPrice,
        Product_Cost__c: x.detail.rowAgency ? 0.0 : x.detail.rowCost , 
        Margin__c: x.detail.rowAgency ? "" : x.detail.rowMargin, 
        Total_Price__c: x.detail.rowAgency ? x.detail.rowFlrPrice : x.detail.rowUnitPrice,
        Cost_per_M__c: 0,
        Cost_per_Acre__c: 0, 
        Product_Size__c: x.detail.rowSize,
        allowEdit: x.detail.rowAgency ? true : false,
        altPriceBookEntryId__c: x.detail.alt_PBE_Id,
        altPriceBookId__c: x.detail.alt_PB_Id,
        altPriceBookName__c: x.detail.alt_PB_Name,
        Area__c:  this.areaId,
        nVal: x.detail.rowN,
        pVal: x.detail.rowP,
        kVal: x.detail.rowK,
        N__c: 0.0,
        P__c: 0.0,
        K__c: 0.0, 
        isFert: x.detail.isFert,
        galLb: x.detail.galWeight,
        Product2Id: x.detail.rowProduct,
        goodPrice: true, 
        agencyProd: x.detail.rowAgency,
        Floor_Price__c: x.detail.rowFlrPrice,
        Level_1_UserView__c: x.detail.rowLevelOne, 
        title:  x.detail.rowAgency ? 'Agency Product': `Unit Price - Flr $${x.detail.rowFlrPrice}`,
        showNote: false,
        btnLabel: 'Add Note',
        btnValue: 'Note', 
        totalUsed: 0, 
        Product_Type__c: x.detail.rowProdType,
        Product_SDS_Label__c:x.detail.rowWebSiteLabel,
        Note_Other__c: '',
        Manual_Charge_Size__c: 0,
        //for style updates
        unitAreaStyles:'slds-col slds-size_2-of-12',
        manCharge: x.detail.rowName.toLowerCase().includes('manual charge'),
        isLowVol__c: false,
        Spray_Vol_M__c: ''
    }]
    this.productIds.includes(x.detail.rowProduct) ? '': this.productIds.push(x.detail.rowProduct);
}
handleHistoric(x){
    this.prodlist = [...this.prodlist,{
        Id: '',
        Product__c: x.detail.Product__c,
        Product_Name__c: x.detail.Name,
        Product_Code__c: x.detail.ProductCode,   
        Rate2__c: 0,
        Application__c: this.updateAppId,
        Note__c: '' ,
        Units_Required__c: 1,
        Unit_Area__c: pref(this.areaUM, x.detail.Product_Type__c),  
        Unit_Price__c: x.detail.agency ? x.detail.floorPrice : x.detail.unitCost,
        Product_Cost__c: x.detail.agency ? 0.0 : x.detail.unitCost , 
        Margin__c: x.detail.agency ? "" : x.detail.margin, 
        Total_Price__c: x.detail.agency ? x.detail.floorPrice : x.detail.UnitPrice,
        Cost_per_M__c: 0,
        Cost_per_Acre__c: 0, 
        Product_Size__c: x.detail.Product_Size__c,
        allowEdit: x.detail.agency ? true : false,
        altPriceBookEntryId__c: x.detail.alt_PBE_Id,
        altPriceBookId__c: x.detail.alt_PB_Id,
        altPriceBookName__c: x.detail.alt_PB_Name,
        Area__c:  this.areaId,
        nVal: x.detail.nVal,
        pVal: x.detail.pVal,
        kVal: x.detail.kVal,
        N__c: 0.0,
        P__c: 0.0,
        K__c: 0.0, 
        isFert: x.detail.isFert,
        galLb: x.detail.galWeight,
        Product2Id: x.detail.Product__c,
        goodPrice: true, 
        agencyProd: x.detail.agency,
        Floor_Price__c: x.detail.floorPrice, 
        title:  x.detail.agency ? 'Agency Product': `Unit Price - Flr $${x.detail.floorPrice}`,
        showNote: false,
        btnLabel: 'Add Note',
        btnValue: 'Note', 
        totalUsed: 0, 
        Product_Type__c: x.detail.Product_Type__c,
        Product_SDS_Label__c:x.detail.labelURL,
        Note_Other__c: '',
        Manual_Charge_Size__c: 0,
        manCharge:false, //x.detail.Name.toLowerCase().includes('manual charge'),
        //for style update ultra low volume
        unitAreaStyles:'slds-col slds-size_2-of-12',
        isLowVol__c: false,
        Spray_Vol_M__c: ''
    }]
    this.productIds.includes(x.detail.Product__c) ? '': this.productIds.push(x.detail.Product__c);
}

//Display proudct info
// productName;
// productCost;
// treatedAcreage;
prodN
prodP
prodK
foundPriceBook
hiMouse(e){
    this.showProdInfo = true; 
    let index = this.prodlist[e.target.dataset.code]
    //console.log(index)
    this.productName = index.Product_Name__c;
    this.productCost = index.agencyProd ? 'Agency':index.Product_Cost__c;
    this.foundPriceBook = index.altPriceBookName__c;
    this.levelOne = index.Level_1_UserView__c;
    this.levelTwo = index.Level_2_UserView__c;
    this.prodFloor = index.Floor_Price__c; 
    this.prodCostM = index.isLowVol__c ? index.Cost_per_M__c : pricePerUnit(index.Unit_Price__c, index.Product_Size__c, index.Rate2__c, index.Unit_Area__c).perThousand;
    this.prodCostA =  index.isLowVol__c ? index.Cost_per_Acre__c :pricePerUnit(index.Unit_Price__c, index.Product_Size__c, index.Rate2__c, index.Unit_Area__c).perAcre;
    this.treatedAcreage = index.isLowVol__c ? index.Acres_Treated__c : areaTreated(index.Product_Size__c,index.Rate2__c, index.Unit_Area__c );
    this.prodN = index.N__c;
    this.prodP = index.P__c;
    this.prodK = index.K__c; 
}
byeMouse(e){
//console.log('run mouse')
}
    newAppNote(event){
        this.wasNewNote = true; 
        this.oppNote = event.detail.value
    }
///UPDATE ALL OPTIONS HERE
radioSelection
setBTN(x){
    this.radioSelection = x.target.value; 
}
get radioOpts(){
    return [
            { label: 'Edit just this event', value: 'one' },
            { label: 'Update Series', value: 'series' },
            {label:'Products in Area', value:'area'},
            {label:'Products in Program', value:'program'}
        ]
}

    evalUpdates(){
        if(this.radioSelection === undefined){
           //alert need 
            return
        }else if(this.radioSelection != "one"){
            //this.updateMulti = true;
            this.update2()
        }else{
            this.updateMulti = false;  
            this.update();
        }
        
    }

    cancelEval(){
        this.updateMulti = false; 
    }
///THIS EVALUATES THE MULTI UPDATE APPLICATIONS STARTS THE UPDATE PROCESS!!!!!!!!
    @api
    evalUpdate(){
        if(this.multiApp){
            this.updateMulti = true;
            
 
        }else{
            this.update(); 
        }
    }

    //UPDATE FOLLOW UP APPLICATIONS TOO 
    @api
    async update2(){
        try {
            this.loaded = false;
        //only works if that tab is open when saving
        //this.oppNote= this.template.querySelector('[data-note="appNote"]').value;

        let params = {
            appName: this.appName,
            appDate: this.appDate,
            appArea: this.areaId, 
            appNote: this.oppNote,
            ds: this.isDropShip,
            tankSize: this.tankSize,
            measurement: this.sprayMeasure,
            volume: this.spraySize
        }

        let appUpdate = await updateApplication({wrapper: params, id:this.appId, newNote:this.wasNewNote});
        let singleUpdate = await updateProducts({products:this.prodlist});
        let followUp = await multiUpdateProd({prodIds: this.productIds, appDate: this.appDate, parentId: this.prodlist[0].prevAppId, 
                                              currentRecId: this.prodlist[0].Application__c, parentAp: this.parentApp, updateType: this.radioSelection, 
                                              area: this.areaId, program: this.programId})
        this.prodlist = [];
        this.dispatchEvent(
            new ShowToastEvent({
                title:'Success',
                message:'Updated Products!',
                variant:'success'
            })
        )
        //close screen
        this.loaded = false;
        this.cancel();
        } catch (error) {
            console.log(JSON.stringify(error));
            
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error adding app',
                    message: JSON.stringify(error),
                    variant: 'error'
                })  
            )
        }
        this.loaded = false;
    }
    @api 
    update(){
        
        this.loaded = false;
        //only works if that tab is open when saving
        //this.oppNote= this.template.querySelector('[data-note="appNote"]').value;

        let params = {
            appName: this.appName,
            appDate: this.appDate,
            appArea: this.areaId, 
            appNote: this.oppNote,
            ds: this.isDropShip,
            tankSize: this.tankSize,
            measurement: this.sprayMeasure,
            volume: this.spraySize
        }
        //console.log('parmas ', params, 'this.appId ',this.appId, ' ap note ', this.wasNewNote);
        updateApplication({wrapper: params, id:this.appId, newNote:this.wasNewNote})
            .then(()=>{
               //console.log(JSON.stringify(this.prodlist))
                 updateProducts({products:this.prodlist});
               
            }).then(()=>{
                     console.log('multiUpdateProd ', this.productIds); 
                    multiUpdateProd({prodIds: this.productIds, appDate: this.appDate, parentId: this.prodlist[0].prevAppId, currentRecId: this.prodlist[0].Application__c})
                }).then((mess)=>{
                //console.log('mess '+mess)
                this.prodlist = [];
                this.dispatchEvent(
                    new ShowToastEvent({
                        title:'Success',
                        message:'Updated Products!',
                        variant:'success'
                    })
                )
                //tell parent to request appDataTable refresh
                this.dispatchEvent(new CustomEvent('update'))
            }).then(()=>{
                this.updateMulti = false
                this.cancel();
            }).catch((error)=>{
                //console.log(JSON.stringify(error))
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error adding app',
                        message: JSON.stringify(error),
                        variant: 'error'
                    })  
                ) 
            })
        }

        //Update Pricing and Fertility info displayed to per M or per Acre
    updateMeasure(){
        this.measure = this.measure === 'M' ? 'Acre' : 'M';
   }
    cancel(){
        this.dispatchEvent(new CustomEvent('cancel'))
        
    }
//handle select drop down on the products
    handleOnselect(event){
        let choice = event.detail.value;
        switch(choice){
            case 'Note':
                 this.prodlist.find((x)=>x.Product_Code__c === event.target.name).showNote = true;
                 this.prodlist.find((x)=>x.Product_Code__c === event.target.name).btnValue = 'Stash';
                 this.prodlist.find((x)=>x.Product_Code__c === event.target.name).btnLabel = 'Hide Note';
                break;
            case 'Delete':
                let prodName = event.target.name; 
                this.removeProd(prodName);
                break;
            case 'Stash':
                this.prodlist.find((e)=>e.Product_Code__c === event.target.name).showNote = false;
                this.prodlist.find((x)=>x.Product_Code__c === event.target.name).btnValue = 'Note';
                this.prodlist.find((x)=>x.Product_Code__c === event.target.name).btnLabel = 'Add Note';
                break;
            default:
                console.log('no choice');
                
        }
    }
    //handle price warnings
    handleWarning = (targ, lev, flr, price, ind)=>{
        console.log(1,targ, 2,lev , 3,flr , 4,price, 5, ind );
        if(this.isDropShip){
            return;
        }else{
            if(price > lev){        
                this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
                this.template.querySelector(`[data-margin="${targ}"]`).style.color ="black";
                this.prodlist[ind].goodPrice = true; 
               
            }else if(price<lev && price>=flr){
                this.template.querySelector(`[data-id="${targ}"]`).style.color ="orange";
                this.template.querySelector(`[data-margin="${targ}"]`).style.color ="orange";
                this.prodlist[ind].goodPrice = true;
                
            }else if(price===lev && price>=flr){
                this.template.querySelector(`[data-id="${targ}"]`).style.color ="black";
                this.template.querySelector(`[data-margin="${targ}"]`).style.color ="black";
                this.prodlist[ind].goodPrice = true;
                
            }else if(price<flr){
                this.template.querySelector(`[data-id="${targ}"]`).style.color ="red";
                this.template.querySelector(`[data-margin="${targ}"]`).style.color ="red";
                this.prodlist[ind].goodPrice = false;
            }
            //seems backward but using a disable btn on the productTable. So if it's bad I need to return a true so the button is disabled. 
            this.goodPricing = checkPricing(this.prodlist) === true ? false : true;
    
            
                this.dispatchEvent(new CustomEvent('price',{
                    detail: this.goodPricing
                })); 
        }
        
    }
    handleDropShip(evt){
        evt.preventDefault();
        this.isDropShip = evt.target.checked;
        console.log(this.isDropShip)
        if(this.isDropShip && this.goodPricing){
            this.dispatchEvent(new CustomEvent('price',{
                detail: false
            }));
        }
    }

    get measOptions() {
        return [
            { label: 'M', value: 'M' },
            { label: 'Acre', value: 'Acre' }
            
        ];
    }
    //value={tankSize} step="0.01" onchange={setTankSize}
    setVolume(x){
        this.spraySize = x.detail.value; 
        console.log('spraySize ', this.spraySize)
    }

    setUoM(x){
        this.sprayMeasure = x.detail.value; 
        console.log('sprayMeasure ', this.sprayMeasure)
    }
    setTankSize(x){
        this.tankSize = x.detail.value; 
        console.log('tankSize', this.tankSize)
    }
}