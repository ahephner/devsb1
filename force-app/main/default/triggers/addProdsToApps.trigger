//trigger to add products to apps on clones.....

trigger addProdsToApps on Application__c ( after insert) {
    string prevID;
    set<Id> appId = new set<ID>(); 
    string value; 
    integer d = 0; 
    for(application__c a: Trigger.new){
        if(a.Prev_App_Id__c != null & a.Clone__c == True){
            string strId = Id.valueOf(a.Id);
            value = strId; 
            prevId = a.prev_app_id__c; 
            appId.add(a.Id); 
        }
    
    
    List<App_Product__c> prods = [SELECT Name, Application__c, Cost_per_Acre__c, Cost_per_M__c, 
                                      							       K__c, LBS_ACRE__c, Margin__c, N__c, Note__c, Note_Other__c, 
                                      							       OZ_M__c, P__c, Product__c, Rate2__c, Unit_Area__c, Unit_Cost__c, 
                                      							       Unit_Price__c, Units_Required__c FROM App_Product__c
                                          							   where application__c = :prevID]; 
    system.debug('***** Trigger Prods ----> ' + prods);
   // Map<String, Application_Product__c> addProds = new Map<String, Application_Product__c>();
    
    List<App_Product__c> products = new List<App_Product__c>(); 
   // for(application__c b: Trigger.new){
    for(App_Product__c ap: prods){  
        App_Product__c x = ap.clone(false);
         x.Application__c = value;
        system.debug('***** Triggerlower loop run ###-> ');
         products.add(x); 
       
    }
    d = d +1; 
    system.debug('***** Trigger Trigger #---> ' + d);
        system.debug('***** Trigger Product List outside insert ' + products);
    if(!products.isEmpty()){
    	upsert products;    
    }
  }
}