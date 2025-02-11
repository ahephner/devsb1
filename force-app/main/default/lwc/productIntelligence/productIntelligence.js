import { LightningElement, api, track } from 'lwc';
import {roundNum, unitsRequired, totalUsed, pricePerUnit, lowVolume, lvUnits,calcDryFert, calcLiqFert, areaTreated} from 'c/programBuilderHelper';
import {checkPricing} from 'c/helper';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import updateProducts from '@salesforce/apex/addApp.updateProducts'
import allAppProducts from '@salesforce/apex/appProduct.allAppProducts';
import SearchContact from 'c/searchContactAddress'
const DELAY = 300;
export default class ProductIntelligence extends LightningElement {
    products = [];
    @api recordId; 
    loaded; 
    prodFilterValue;
    productList = [];
    allProds = [];
   @track displayProds = []; 
    showHeader = false; 
    updateAll = false; 
    areaSizeM;
    areaAcres; 
    aboveFloorPrice;
    allAboveFloorPrice;
    connectedCallback(){
        this.loaded = false
        this.firstLoad(); 
    }

               //for the combo box 
        get unitArea(){
            return [
                {label:'OZ/M', value:'OZ/M'}, 
                {label: 'OZ/Acre', value:'OZ/Acre'},
                {label: 'LB/M', value:'LB/M'},
                {label: 'LB/Acre', value:'LB/Acre'},
                {label:'100 Gal', value:'100 Gal'}
                ];
            }
    async firstLoad(){
        let prodIds = new Set();
        let loadProd = await allAppProducts({rec: this.recordId });
      
        this.products = loadProd.map(item=>{
            let name = item.Product_Name__c;
            let code = item.Product_Code__c;
            let price = item.Unit_Price__c;
            let margin = item.Margin__c
            let rate = item.Rate2__c;
            let areaName = item.Area__c;
            let day = item.Application__r.Date__c.slice(8,11);
            let month = item.Application__r.Date__c.slice(5,7)
            let year = item.Application__r.Date__c.slice(0,4)
            let floor = item.Product__r.Floor_Price__c
            let unitAreaStyles = item.isLowVol__c ? 'slds-col slds-size_2-of-12 lowVolume' : 'slds-col slds-size_2-of-12';
            let goodPrice = item.Unit_Price__c >= item.Product__r.Floor_Price__c? false:true;  
            //designate updates
            let flag = false;
            //let date = this.reverseString()
            let allowEdit = item.Product__r.Agency_Pricing__c;
            let appNameDate = `${item.Application__r.Name} - ${month}/${day}/${year}`
            return {...item, name, code, price, appNameDate, areaName, margin, rate, allowEdit, flag, floor, goodPrice, unitAreaStyles}
        })
        this.areaSizeM = roundNum(parseFloat(this.products[0].Application__r.Area__r.Area_Sq_Feet__c),2);
        this.areaAcres = roundNum(parseFloat(this.products[0].Application__r.Area__r.Area_Acres__c),2);
        let filters = this.buildProdFilter(this.products);
        this.aboveFloorPrice = checkPricing(this.products)
        this.loaded = true; 
    }

    
    buildProdFilter(data){
        console.log(data)
        let initArray= [];
        for(let i = 0; i<data.length; i++){
            let name = data[i].Product_Name__c;
            let id = data[i].Product__c;
            
            let obj = {label:name, value:id, Id:id}
            initArray.findIndex(x=>x.label === obj.label) === -1 ? initArray.push(obj) : '';
            this.allProds.push(obj)
        }
        
        this.productList = [{label:'Pick Product', value:'Pick Product'}, {label:'search', value:'search'},...initArray];
        this.prodFilterValue = 'Pick Product';  
        
    }
    headName;
    headRate;
    headUOM;
    headMargin;
    headUnitPrice;
    headAgency;
    headCost; 
    headProductSize;
    headFloor; 
    headAllUnits; 
    headAvgAcre; 
    headUnitStyle; 
    headLowVol
    headLowMix
    getUnitAverage(data, field){
         return roundNum(data.reduce((num,sum)=> sum[field] +num, 0)/ data.length,2)
    }
    getCount(data, field){
        return roundNum(data.reduce((num, sum)=> sum[field] +num,0),2)
    }
    setHeaders(data, allData){
        this.headName= data.Product_Name__c;
        this.headRate= this.getUnitAverage(allData, "Rate2__c");
        this.headUOM= data.Unit_Area__c;
        this.headCost = data.Product_Cost__c; 
        this.headMargin= data.Margin__c ? this.getUnitAverage(allData, "Margin__c") : 0;
        this.headAllUnits = this.getCount(allData,'Units_Required__c')
        this.headUnitPrice= this.getUnitAverage(allData, "Unit_Price__c")
        this.headAvgAcre = this.getUnitAverage(allData, 'Cost_per_Acre__c')
        this.headAgency = data.Product__r.Agency_Pricing__c; 
        this.headProductSize = data.Product_Size__c; 
        this.headFloor = data.Product__r.Agency_Pricing__c ? 'Agency' : data.Product__r.Floor_Price__c; 
        this.headUnitStyle = data.isLowVol__c ? 'slds-col slds-size_2-of-12 lowVolume' : 'slds-col slds-size_2-of-12';
        this.headLowVol = data.isLowVol__c
        this.headLowMix = data.Spray_Vol_M__c; 
    }

    filterProd(x){
        x.preventDefault();
           let prodFilter = x.target.options.find(opt => opt.value === x.detail.value);
           this.prodFilterValue = prodFilter.value; 
           if(this.prodFilterValue === 'search'){
            this.openSearch()
           }else{
            this.loaded = false; 
          
            this.displayProds = this.products.filter(x=> x.Product__c === this.prodFilterValue).sort((a,b)=>a.Application__r.Date__c.localeCompare(b.Application__r.Date__c))
            //need a function to destructure first value and get averages
            this.setHeaders(this.displayProds[0], this.displayProds)
            this.showHeader = true; 
            this.loaded = true; 
           }

        }

        async openSearch(){
            const show = await SearchContact.open({
                size: 'medium',
                description: 'address',
                content: this.productList.slice(2)
            }).then((res)=>{
                
                this.prodFilterValue = res;
                this.loaded = false; 
          
                this.displayProds = this.products.filter(x=> x.Product__c === this.prodFilterValue).sort((a,b)=>a.Application__r.Date__c.localeCompare(b.Application__r.Date__c))
                //need a function to destructure first value and get averages
                this.setHeaders(this.displayProds[0], this.displayProds)
                this.showHeader = true; 
                this.loaded = true;  
            })
        }
    //track saves
    allRate(e){
        this.headRate = e.detail.value; 
        this.updateAll = true;
    }
    allUnitArea(e){
        this.headUOM = e.detail.value;
        this.headLowVol = e.detail.value === '100 Gal'? true: false; 
        this.headUnitStyle = e.detail.value === '100 Gal' ? 'slds-col slds-size_2-of-12 lowVolume' : 'slds-col slds-size_2-of-12';
        this.updateAll = true;
    }

    handleAllPrice(e){
        this.headUnitPrice = Number(e.detail.value);
        window.clearTimeout(this.delay);
        this.delay = setTimeout(()=>{
            this.allAboveFloorPrice = this.headUnitPrice>=this.headFloor ? false:true; 
            this.headMargin = roundNum((1 - (this.headCost /this.headUnitPrice))*100, 2);
        },DELAY)
        this.updateAll = true; 
    }
    allMargin(e){
        this.headMargin = Number(e.detail.value);
        window.clearTimeout(this.delay);
        this.delay = setTimeout(()=>{
            this.headUnitPrice = roundNum(this.headCost /(1- this.headMargin/100), 2)
            this.allAboveFloorPrice = this.headUnitPrice>=this.headFloor ? false:true; 
        },DELAY)
        this.updateAll = true; 
    }
    handleHeadLowVol(e){
        this.headLowMix = Number(e.detail.value)

    }
    handleSave(){
        this.loaded = false; 
        if(this.updateAll){
            this.handleUpdateAll()
            this.updateAll = false; 
        }else{
            this.handleSingleUpdates()
        }
    }

    findFlags(data){
        return [...data.filter(x=> x.flag === true).map(item=>({
            ...item, 
            flag:false
        }))]
    }
    async handleSingleUpdates(){
        let dataToUpdate = this.findFlags(this.displayProds)
        let update = await updateProducts({products: dataToUpdate})
                if(update == 'success'){
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Ship It!',
                            variant: 'success'
                        })
                    );
                }else{
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Margin Error',
                            message: update,
                            variant: 'error'
                        })
                    )

                }
                this.loaded = true; 
    }
//track cancels
    async handleUpdateAll(){

            this.loaded = false; 
            let reqUnits = unitsRequired(this.headUOM, this.headRate,this.areaSizeM, this.headProductSize )
            let prodCost  = pricePerUnit(this.headUnitPrice, this.headProductSize, this.headRate,this.headUOM);
            //let totalUse = totalUsed(this.headUOM, this.areaSizeM, this.headRate)
            for(let i=0; i< this.displayProds.length; i++){
                    this.displayProds[i].Unit_Price__c = this.headUnitPrice;
                    this.displayProds[i].Margin__c = this.headMargin;
                    this.displayProds[i].Rate2__c = this.headRate; 
                    this.displayProds[i].Unit_Area__c = this.headUOM;
                    this.displayProds[i].Units_Required__c = reqUnits;
                    if(this.displayProds[i].Unit_Area__c != '100 Gal'){
                        this.displayProds[i].Cost_Per_M__c = prodCost.perThousand;
                        this.displayProds[i].Cost_per_Acre__c = prodCost.perAcre;
                    }else if(this.displayProds[i].Unit_Area__c === '100 Gal'){
                    //calculate low volume like steal green
                        let finished = lowVolume(this.headRate, this.headProductSize, this.headLowMix, this.headUnitPrice)
                        this.displayProds[i].Cost_per_M__c = finished.singleThousand;
                        this.displayProds[i].Cost_per_Acre__c = finished.singleAcre;
                        this.displayProds[i].Acres_Treated__c = finished.acresTreated;
                        this.displayProds[i].Units_Required__c = lvUnits(this.areaSizeM, this.displayProds[i].Application__r.Spray_Vol__c, this.headProductSize, this.headRate);
                    }
                    //calculate fertilizers
                    if(this.displayProds[i].isFert){
                        let fert = this.displayProds[index].Product_Type__c === 'Dry' ? calcDryFert(this.headRate, this.displayProds[i]) : calcLiqFert(this.headRate, this.displayProds[i]);
                        this.displayProds[i].N__c = fert.n;
                        this.displayProds[i].P__c = fert.p;
                        this.displayProds[i].K__c = fert.k;

                    }
            }

                let update = await updateProducts({products: this.displayProds})
                if(update == 'success'){
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Ship It!',
                            variant: 'success'
                        })
                    );

                }else{
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Margin Error',
                            message: update,
                            variant: 'error'
                        })
                    )

                }
               //let x = await this.firstLoad();
                this.loaded = true; 
    }

    newRate(e){
        let index = this.displayProds.findIndex(x=>x.Id === e.target.name);
        window.clearTimeout(this.delay);
        this.delay = setTimeout(()=>{
            this.displayProds[index].Rate2__c = Number(e.detail.value);
            //console.log('ua '+this.displayProds[index].Unit_Area__c);
            
            if(this.displayProds[index].Unit_Area__c != '' && this.displayProds[index].Unit_Area__c != null && this.displayProds[index].Unit_Area__c != '100 Gal' ){
                this.displayProds[index].Units_Required__c = unitsRequired(this.displayProds[index].Unit_Area__c, this.displayProds[index].Rate2__c, this.areaSizeM, this.displayProds[index].Product_Size__c )    
                this.displayProds[index].totalUsed = totalUsed(this.displayProds[index].Unit_Area__c, this.areaSizeM, this.displayProds[index].Rate2__c);
                this.displayProds[index].Total_Price__c = roundNum(this.displayProds[index].Units_Required__c * this.displayProds[index].Unit_Price__c, 2);
                
                
                
                let prodCost = pricePerUnit(this.displayProds[index].Unit_Price__c, this.displayProds[index].Product_Size__c, this.displayProds[index].Rate2__c,this.displayProds[index].Unit_Area__c);
                this.displayProds[index].Cost_per_M__c = prodCost.perThousand;
                this.displayProds[index].Cost_per_Acre__c = prodCost.perAcre; 
 
                this.treatedAcreage = areaTreated(this.displayProds[index].Product_Size__c,this.displayProds[index].Rate2__c, this.displayProds[index].Unit_Area__c ); 
                
                //console.log(1,this.displayProds[index].Unit_Area__c,2, this.displayProds[index].Rate2__c, 3,this.areaSizeM,4, this.displayProds[index].Product_Size__c)
                if(this.displayProds[index].isFert){
                    let fert = this.displayProds[index].Product_Type__c === 'Dry' ? calcDryFert(this.displayProds[index].Rate2__c, this.displayProds[index]) : calcLiqFert(this.displayProds[index].Rate2__c, this.displayProds[index]);
                    this.displayProds[index].N__c = fert.n;
                    this.displayProds[index].P__c = fert.p;
                    this.displayProds[index].K__c = fert.k;

                }
            }else if(this.displayProds[index].Unit_Area__c ==='100 Gal'){
                this.displayProds[index].isLowVol__c = true; 
                this.displayProds[index].unitAreaStyles = 'slds-col slds-size_2-of-12 lowVolume'
                this.displayProds[index].Rate2__c = Number(e.detail.value)
                let {Rate2__c, Product_Size__c, Spray_Vol_M__c, Unit_Price__c} = this.displayProds[index];

                if(Spray_Vol_M__c>0 && Rate2__c> 0){
                   
                    let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, Unit_Price__c) 
                    console.log(finished)
                    //updateValues
                    this.displayProds[index].Units_Required__c = lvUnits(this.areaSizeM, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                    this.displayProds[index].Total_Price__c = roundNum(this.displayProds[index].Units_Required__c * this.displayProds[index].Unit_Price__c, 2);
                    
                     
                    this.displayProds[index].Cost_per_M__c = finished.singleThousand;
                    this.displayProds[index].Cost_per_Acre__c = finished.singleAcre;
                    this.displayProds[index].Acres_Treated__c = finished.acresTreated;
                }

               }
               this.displayProds[index].flag = true; 
        },500)
       //this.displayProds = [...this.displayProds]
    }
    handleLowVol(e){
        let index = this.displayProds.findIndex(prod => prod.Id === e.target.name);
        
        if(this.displayProds[index].Rate2__c === undefined || this.displayProds[index].Rate2__c<=0){
            return;
        }else{
            window.clearTimeout(this.delay);
            
            this.delay = setTimeout(()=>{
                
             let sprayVolum = Number(e.detail.value); 
             let {Rate2__c, Product_Size__c, Unit_Price__c} = this.displayProds[index];
             let finished = lowVolume(Rate2__c, Product_Size__c, sprayVolum, Unit_Price__c) 
             
             //updateValues
             this.displayProds[index].Units_Required__c = lvUnits(this.areaSizeM, sprayVolum, Product_Size__c, Rate2__c);
             this.displayProds[index].Total_Price__c = roundNum(this.displayProds[index].Units_Required__c * this.displayProds[index].Unit_Price__c, 2);
             
             this.displayProds[index].Spray_Vol_M__c = sprayVolum; 
             this.displayProds[index].Cost_per_M__c = finished.singleThousand;
             this.displayProds[index].Cost_per_Acre__c = finished.singleAcre;
             this.displayProds[index].Acres_Treated__c = finished.acresTreated;
             this.displayProds[index].flag = true; 
             this.prodCostM = finished.singleThousand;
             this.prodCostA = finished.singleAcre;
             this.treatedAcreage = finished.acresTreated
             //this.prodAreaCost = this.areaAcres * this.costPerAcre;
             this.treatedAcreage = finished.acresTreated
             this.appTotalPrice = appTotal(this.displayProds); 
             this.totalCostPerM = roundNum(Object.values(this.displayProds).reduce((t,{Cost_per_M__c})=>t+Cost_per_M__c,0),2)

            },500)

        }
       }
    handleUnitArea(e){
        let index = this.displayProds.findIndex(x=>x.Id === e.target.name);
        
            
        this.displayProds[index].Unit_Area__c = e.detail.value;
        //show low volume or not
        this.displayProds[index].isLowVol__c = e.detail.value!= '100 Gal'? false: true;;
        this.displayProds[index].unitAreaStyles = e.detail.value!= '100 Gal' ?'slds-col slds-size_2-of-12': 'slds-col slds-size_2-of-12 lowVolume'
        
        if(this.displayProds[index].Rate2__c > 0 && e.detail.value!= '100 Gal'){
         this.displayProds[index].Units_Required__c = unitsRequired(this.displayProds[index].Unit_Area__c, this.displayProds[index].Rate2__c, this.areaSizeM, this.displayProds[index].Product_Size__c );
         this.displayProds[index].Total_Price__c = roundNum(this.displayProds[index].Units_Required__c * this.displayProds[index].Unit_Price__c, 2);

         let prodCost = pricePerUnit(this.displayProds[index].Unit_Price__c, this.displayProds[index].Product_Size__c, this.displayProds[index].Rate2__c,this.displayProds[index].Unit_Area__c);
         this.displayProds[index].Cost_per_M__c = prodCost.perThousand;
         this.displayProds[index].Cost_per_Acre__c = prodCost.perAcre; 


         
         this.treatedAcreage = areaTreated(this.displayProds[index].Product_Size__c,this.displayProds[index].Rate2__c, this.displayProds[index].Unit_Area__c );
         

        //handle updating fertilizer amounts
         if(this.displayProds[index].isFert){
            let fert = this.displayProds[index].Product_Type__c === 'Dry' ? calcDryFert(this.displayProds[index].Rate2__c, this.displayProds[index]) : calcLiqFert(this.displayProds[index].Rate2__c, this.displayProds[index]);
            this.displayProds[index].N__c = fert.n;
            this.displayProds[index].P__c = fert.p;
            this.displayProds[index].K__c = fert.k;
        }
        }else if(e.detail.value ==='100 Gal'){
            let {Rate2__c, Product_Size__c, Unit_Price__c, Spray_Vol_M__c, Cost_per_Acre__c} = this.displayProds[index];
            if(Spray_Vol_M__c>0 && Rate2__c> 0){
                 let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, Unit_Price__c) 
            
                //updateValues
                 this.displayProds[index].Units_Required__c = lvUnits(this.areaSizeM, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                 this.displayProds[index].Total_Price__c = roundNum(this.displayProds[index].Units_Required__c * this.displayProds[index].Unit_Price__c, 2); 

                 this.displayProds[index].Cost_per_M__c = finished.singleThousand;
                 this.displayProds[index].Cost_per_Acre__c = finished.singleAcre;
            }
        }
    }

    handleUnitPrice(e){
        window.clearTimeout(this.delay);
        let index = this.displayProds.findIndex(x=>x.Id === e.target.name);
        let targetId = e.target.name; 

        this.delay = setTimeout(()=>{
            
            this.displayProds[index].Unit_Price__c = Number(e.detail.value);
                if(this.displayProds[index].Unit_Price__c > 0 && this.displayProds[index].Unit_Area__c != '100 Gal'){
                this.displayProds[index].Margin__c = roundNum((1 - (this.displayProds[index].Product_Cost__c /this.displayProds[index].Unit_Price__c))*100,2)
                
                
                this.displayProds[index].Total_Price__c = roundNum(this.displayProds[index].Units_Required__c * this.displayProds[index].Unit_Price__c,2);
                
                
                let prodCost = pricePerUnit(this.displayProds[index].Unit_Price__c, this.displayProds[index].Product_Size__c, this.displayProds[index].Rate2__c,this.displayProds[index].Unit_Area__c);
                
                this.displayProds[index].Cost_per_M__c = prodCost.perThousand;
                this.displayProds[index].Cost_per_Acre__c = prodCost.perAcre; 

            }else if(this.displayProds[index].Unit_Price__c > 0 && this.displayProds[index].Unit_Area__c === '100 Gal'){
                let {Rate2__c, Product_Size__c, Spray_Vol_M__c} = this.displayProds[index];

                this.displayProds[index].Margin__c = roundNum((1 - (this.displayProds[index].Product_Cost__c /this.displayProds[index].Unit_Price__c))*100,2)

                if(Spray_Vol_M__c>0 && Rate2__c> 0){
                    let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, this.displayProds[index].Unit_Price__c) 
               
                   //updateValues
                    this.displayProds[index].Units_Required__c = lvUnits(this.areaSizeM, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                    this.displayProds[index].Total_Price__c = roundNum(this.displayProds[index].Units_Required__c * this.displayProds[index].Unit_Price__c, 2); 

                    this.displayProds[index].Cost_per_M__c = finished.singleThousand;
                    this.displayProds[index].Cost_per_Acre__c = finished.singleAcre;
               }
            }else{
                this.displayProds[index].Margin__c = 0;                
                this.displayProds[index].Margin__c = roundNum(this.displayProds[index].Margin__c, 2);
                this.displayProds[index].Total_Price__c = roundNum(this.displayProds[index].Units_Required__c * this.displayProds[index].Unit_Price__c,2)
                
               
                let prodCost = pricePerUnit(this.displayProds[index].Unit_Price__c, this.displayProds[index].Product_Size__c, this.displayProds[index].Rate2__c,this.displayProds[index].Unit_Area__c);
                
                this.displayProds[index].Cost_per_M__c = prodCost.perThousand;
                this.displayProds[index].Cost_per_Acre__c = prodCost.perAcre; 
                
 
            }
                //check floor violation
                this.handleWarning(index); 
                this.displayProds[index].goodPrice = this.displayProds[index].Unit_Price__c >= this.displayProds[index].Product__r.Floor_Price__c? true : false;
                this.aboveFloorPrice = checkPricing(this.displayProds) === false? true:false;  
            
            }, 1000)
    }

    newMargin(e){
        window.clearTimeout(this.delay)
        let index = this.displayProds.findIndex(prod => prod.Id === e.target.name)
        let targetId = e.target.name;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.delay = setTimeout(()=>{
                this.displayProds[index].Margin__c = Number(e.detail.value);
                if(1- this.displayProds[index].Margin__c/100 > 0 && this.displayProds[index].Unit_Area__c != '100 Gal'){
                    this.displayProds[index].Unit_Price__c = roundNum(this.displayProds[index].Product_Cost__c /(1- this.displayProds[index].Margin__c/100),2);
                    //check floor violation
                    this.aboveFloorPrice = this.displayProds[index].Unit_Price__c >= this.displayProds[index].Product__r.Floor_Price__c? false:true  
                    this.displayProds[index].Total_Price__c = roundNum(this.displayProds[index].Units_Required__c * this.displayProds[index].Unit_Price__c, 2);

                    let prodCost = pricePerUnit(this.displayProds[index].Unit_Price__c, this.displayProds[index].Product_Size__c, this.displayProds[index].Rate2__c,this.displayProds[index].Unit_Area__c);
        
                    this.displayProds[index].Cost_per_M__c = prodCost.perThousand;
                    this.displayProds[index].Cost_per_Acre__c = prodCost.perAcre; 
                                    
                }else if(1- this.displayProds[index].Margin__c/100 > 0 && this.displayProds[index].Unit_Area__c === '100 Gal'){
                    let {Rate2__c, Product_Size__c, Spray_Vol_M__c} = this.displayProds[index];
                    
                    this.displayProds[index].Unit_Price__c = roundNum(this.displayProds[index].Product_Cost__c /(1- this.displayProds[index].Margin__c/100),2);
                    
                    if(Spray_Vol_M__c>0 && Rate2__c> 0){
                        let finished = lowVolume(Rate2__c, Product_Size__c, Spray_Vol_M__c, this.displayProds[index].Unit_Price__c) 
                   
                       //updateValues
                        this.displayProds[index].Units_Required__c = lvUnits(this.areaSizeM, Spray_Vol_M__c, Product_Size__c, Rate2__c);
                        this.displayProds[index].Total_Price__c = roundNum(this.displayProds[index].Units_Required__c * this.displayProds[index].Unit_Price__c, 2); 
   
                        this.displayProds[index].Cost_per_M__c = finished.singleThousand;
                        this.displayProds[index].Cost_per_Acre__c = finished.singleAcre;

                   }
                }else{
                    this.displayProds[index].Unit_Price__c = 0;
                    this.displayProds[index].Unit_Price__c = roundNum(this.displayProds[index].Unit_Price__c, 2); 
                    this.displayProds[index].Total_Price__c = roundNum(this.displayProds[index].Units_Required__c * this.displayProds[index].Unit_Price__c,2);
                    
                    let prodCost = pricePerUnit(this.displayProds[index].Unit_Price__c, this.displayProds[index].Product_Size__c, this.displayProds[index].Rate2__c,this.displayProds[index].Unit_Area__c);
        
                    this.displayProds[index].Cost_per_M__c = prodCost.perThousand;
                    this.displayProds[index].Cost_per_Acre__c = prodCost.perAcre; 
 
                    
                    
                }
                    //check floor violation
                            
                   this.handleWarning(index); 
                    this.displayProds[index].goodPrice = this.displayProds[index].Unit_Price__c >= this.displayProds[index].Product__r.Floor_Price__c ? true : false;
                    this.aboveFloorPrice = checkPricing(this.displayProds) === false? true:false;
    },1000)
    }

    handleWarning(i){
        let price = this.displayProds[i].Unit_Price__c
        let flr = this.displayProds[i].Product__r.Floor_Price__c

        if(price>=flr){
            this.template.querySelector(`[data-margin="${this.displayProds[i].Id}"]`).style.color ="black";
            this.template.querySelector(`[data-id="${this.displayProds[i].Id}"]`).style.color ="black";
        }else{
            this.template.querySelector(`[data-margin="${this.displayProds[i].Id}"]`).style.color ="red";
            this.template.querySelector(`[data-id="${this.displayProds[i].Id}"]`).style.color ="red";
        }
    }

    fixFloor(){
        let floor = this.displayProds[0].Product__r.Floor_Price__c;
        let margin = roundNum((1 - (this.displayProds[0].Product_Cost__c /this.displayProds[0].Product__r.Floor_Price__c))*100,2);
        for(let i=0; i< this.displayProds.length; i++){
            this.displayProds[i].Unit_Price__c = floor; 
            this.displayProds[i].Margin__c = margin;
            this.displayProds[i].goodPrice = true;
            this.template.querySelector(`[data-margin="${this.displayProds[i].Id}"]`).style.color ="black";
            this.template.querySelector(`[data-id="${this.displayProds[i].Id}"]`).style.color ="black";
        }
        this.aboveFloorPrice = false; 
    }
}