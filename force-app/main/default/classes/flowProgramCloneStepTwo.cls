public class flowProgramCloneStepTwo {
	
    //inputs from flow
    public class proInputs{
        @InvocableVariable
        public list<Application__c> ApplicationList;
        
        @InvocableVariable
        public string accountId; 
    }
        @InvocableMethod(label='Clone Products with Price Books' description='Needs to go after flowProgramCloneStepOne' )
    	public static list<string> flowBusinessInBoxStepTwo(list<proInputs> params){
   			SavePoint sp = Database.setSavepoint();
            proInputs info = params[0];
            Map<String, String> appId = new Map<String, String>(); 
            list<Application__c> apps = info.ApplicationList;
            List<App_Product__c> ListCloneProds = new List<App_Product__c>(); 
            try{
                for(Application__c x:apps){
                    appId.put(x.Prev_App_Id__c, x.Id);
                }
 
        List<App_Product__c> prod = new List<App_Product__c>([SELECT Name, Application__c, Cost_per_Acre__c, Cost_per_M__c, 
                                 							       K__c, LBS_ACRE__c, Margin__c, N__c, Note__c, Note_Other__c, 
                                 							       OZ_M__c, P__c, Product__c, Rate2__c, Unit_Area__c, Unit_Cost__c, 
                                           					       Unit_Price__c, Units_Required__c, altPriceBookEntryId__c,
                                                              	   altPriceBookId__c, altPriceBookName__c, Product__r.Size__c, Total_Price_LWC__c 
                                                              	   FROM App_Product__c 
                                                                   where Application__c in: appId.keySet()]);
                    //need to get unique product id's to prevent too many soql's when getting pricing. 
         Set<string> uniqueProdIds = new Set<string>(); 
         for(App_Product__c x: prod){
             uniqueProdIds.add(x.Product__c); 
         }
         list<string> toList = new list<string>(uniqueProdIds);
                
         //Pricing section. Get Price Books from account id then get pricing based on unique id
         //need to get a map with the price book price using the unique product id's
        //getPriceboook !IMPORTANT this is different that getPriceBooks.getPriceBookIds that returns more info used in lwc
        
        list<String> pricebookIds = getPriceBooks.getPriceBookIdOnly(info.accountId);
                //system.debug(pricebookIds);
                //system.debug(toList); 
        Map<String, Map<String, pricebookentry>> priceList = getPriceBooks.mapPriorityBestPrice(priceBookIds, toList);
                //system.debug(priceList);
             for(App_Product__c x: prod){
             	App_Product__c clonedProd = x.clone(false);
  				Map<String, PricebookEntry> singlePrice = pricelist.get(x.Product__c); 			             	
             	PriceBookEntry pricing = singlePrice.get(x.Product__c);    
               system.debug(singlePrice);
                 system.debug(pricing); 
                clonedProd.altPriceBookEntryId__c = pricing.Id;
             	clonedProd.altPriceBookId__c = pricing.Pricebook2Id;
             	clonedProd.altPriceBookName__c = pricing.Pricebook2.Name; 
             	clonedProd.Unit_Price__c = pricing.UnitPrice;
             	clonedProd.Margin__c = pricing.Program_Planner_Margin__c;
             	clonedProd.Unit_Cost__c = pricing.Product_Cost__c; 
             	//set cost per acre per thousand
             	cpqProgramClone.costCals costs = cpqProgramClone.calcAcreCharge(pricing.UnitPrice,x.Product__r.Size__c, x.Rate2__c,x.Unit_Area__c);
             	//system.debug(costs); 
                 clonedProd.Cost_per_Acre__c = costs.costPerAcre;
             	clonedProd.Cost_per_M__c = costs.costPerM; 
             	clonedProd.Total_Price_LWC__c = pricing.UnitPrice * clonedProd.Units_Required__c;  
             	clonedProd.Application__c = appId.get(x.Application__c); 
             	ListCloneProds.add(clonedProd); 
         }
                
         if(ListCloneProds.size()> 1){
             insert ListCloneProds;
         }
            }catch(exception e){
            	Database.rollback(sp);
            	system.debug(e.getCause());
            }
            return null;      
    }
    
}