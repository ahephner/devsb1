@isTest
private class test_appProduct {
  static Product2 r1 = new Product2();
  static Product2 r2 = new Product2();
  static Product2 r3 = new Product2();
  static Product2 r4 = new Product2();
  static Area__c area = new Area__c();
  static Program__c prog = new Program__c(); 
  static Application__c Application = new Application__c(); 	
  static {
        //pricebook
        Id pricebookId = Test.getStandardPricebookId();
    // insert some products
         r1.Name='Product 1';
         r1.Primary_Category__c = 'Chemicals';
         r1.Subcategory__c ='Herbicide - Premium';
         r1.Include_in_Programs__c = True;
         r1.IsActive= True; 
         r1.ProductCode='123';
         r1.Product_Status__c ='Stock';
         r1.Size__c = 128;
         r1.Floor_Type__c ='Floor'; 
         r1.Floor_Price__c = 100;  
     	 r1.Product_Type__c = 'Liquid';
     	 r1.Product_Family__c = 'FMC';
      
         r2.Name='Product 2';
         r2.Primary_Category__c = 'Chemicals';
         r2.Subcategory__c = 'Fungicide';
         r2.Include_in_Programs__c = True;
         r2.IsActive= True; 
         r2.ProductCode='123';
         r2.Product_Status__c ='Stock';
         r2.Size__c = 128;
         r2.Floor_Type__c ='Floor'; 
         r2.Floor_Price__c = 100;
     	 r2.Product_Type__c = 'Liquid';
     	 r2.Product_Family__c = 'FMC'; 
     
     	r3.Name='Product 3';
     	r3.Primary_Category__c = 'Chemicals';
     	r3.Subcategory__c ='Herbicide - Premium';
     	r3.Include_in_Programs__c = True;
     	r3.Size__c = 128; 
     	r3.Product_Status__c = 'Stock';
        r3.Floor_Type__c ='Floor'; 
        r3.Floor_Price__c = 100;
     	r3.Product_Type__c = 'Liquid';
     	r3.Product_Family__c = 'FMC';
      
      	r4.Name='Product 4';
     	r4.Primary_Category__c = 'Chemicals';
     	r4.Subcategory__c ='Fungicide';
        r4.Include_in_Programs__c = True;
        r4.IsActive= True; 
        r4.ProductCode='123';
        r4.Product_Status__c ='Stock';
        r4.Size__c = 128;
        r4.Floor_Type__c ='Floor'; 
        r4.Floor_Price__c = 100;
     	r4.Product_Type__c = 'Liquid';
     	r4.Product_Family__c = 'FMC';
    
    	insert r1;
    	insert r2;
    	insert r3; 
    	insert r4; 
      
              //pricebook entries
        PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=r1.id,
                                                 unitprice=100, IsActive = True, UseStandardPrice=False);
        PricebookEntry pbe2 = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=r2.id,
                                                 unitprice=110, IsActive = True, UseStandardPrice=False);
        PricebookEntry pbe3 = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=r3.id,
                                                 unitprice=130, IsActive = True, UseStandardPrice=False);
        PricebookEntry pbe4 = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=r4.id,
                                                 unitprice=140, IsActive = True, UseStandardPrice=False);
		insert pbe;
        insert pbe2;
      	insert pbe3;
      	insert pbe4;
    // setup a new account
    Account cust = new Account();
    cust.Name = 'Test123456';
    cust.Type = 'Customer';
    cust.Customer_Name__c = 'Test Customer 123456';
    insert cust;
      
    // create new program
    Program__c prog = new Program__c();
    prog.Name = 'Test Program 2018';
    prog.Account__c = cust.Id;
    insert prog;
    
    // create new area
    area.Name = 'Greens';
    area.Program__c = prog.Id;
    area.Area_Acres__c = 1000;
    insert area;
     
    Application.Name = 'test app';
    Application.Area__c = area.id;  
    insert Application;
      //app products
        App_Product__c ap1 = new App_Product__c(Application__c=application.Id,Product__c = r1.Id, Rate2__c =2,Units_Required__c = 2,
                                                OZ_M__c = 3, Note__c ='', Unit_Area__c = 'OZ/M',Unit_Price__c = 12,Margin__c =13,
                                               Unit_Cost__c = 2,N__c = 0, P__c=0, K__c=0);
        App_Product__c ap2 = new App_Product__c(Application__c=application.Id,Product__c = r2.Id, Rate2__c =2,Units_Required__c = 2,
                                                OZ_M__c = 3, Note__c ='', Unit_Area__c = 'OZ/M',Unit_Price__c = 12,Margin__c =13,
                                               Unit_Cost__c = 2,N__c = 0, P__c=0, K__c=0);
        App_Product__c ap3 = new App_Product__c(Application__c=application.Id,Product__c = r3.Id, Rate2__c =2,Units_Required__c = 2,
                                                OZ_M__c = 3, Note__c ='', Unit_Area__c = 'OZ/M',Unit_Price__c = 12,Margin__c =13,
                                               Unit_Cost__c = 2,N__c = 0, P__c=0, K__c=0);
        App_Product__c ap4 = new App_Product__c(Application__c=application.Id,Product__c = r4.Id, Rate2__c =2,Units_Required__c = 2,
                                                OZ_M__c = 3, Note__c ='', Unit_Area__c = 'OZ/M',Unit_Price__c = 12,Margin__c =13,
                                               Unit_Cost__c = 2,N__c = 0, P__c=0, K__c=0);
  }
    //test wrapper 
    @isTest 
    static void testAreaWrapper(){
        string label = 'green';
        string value = 'green'; 
       areaWrapper t = new areaWrapper(label, value);  
        System.assertNotEquals(null, t); 
    }
    
    //get area Info
    @isTest
    static void testGetArea(){
       test.startTest();
        List<Area__c> areaCall = appProduct.areaInfo(area.id);
       test.stopTest();
        system.assertEquals(1, areaCall.size()); 
    }
		//test getting area id's for the appArea
    @isTest
    static void testGetAreas(){
    
  	List<Application__c> apps = new List<Application__c>();
        //insert apps
    	Application__c a1 = new Application__c(name='Spring Test App 1');
    	a1.Area__c = area.Id;
    	Application__c a2 = new Application__c(name='Spring Test App 2');
    	a2.Area__c = area.Id;
    	apps.add(a1);
    	apps.add(a2);       
    	insert apps;
       		Test.startTest(); 
        		list<areaWrapper> aw = appProduct.getAreas(a1.id); 
        		system.assertNotEquals(null, aw);
      		 Test.stopTest();  
         
    }
    
	@isTest
    static void testGetApps(){
        List<Application__c> fallApp = new List<Application__c>();
    	Application__c a3 = new Application__c(name='Fall Test App 1');
    	a3.Area__c = area.Id;
    	Application__c a4 = new Application__c(name='Fall Test App 2');
    	a4.Area__c = area.Id;
    	fallApp.add(a3);
    	fallApp.add(a4);       
    	insert fallApp;
        Test.startTest(); 
        	list<application__c> appList = appProduct.getApps(prog.Id);         	
       Test.stopTest();
        	list<application__c> al = [select id from application__c where area__c=: area.id]; 
        system.debug(al);	
        system.assertEquals(3, al.size());
        
    }
    
    @isTest 
    static void testAppProducts(){
        list<App_Product__c> apList = new list<App_Product__c>(); 
        App_Product__c ap1 = new App_Product__c(Application__c=application.Id,Product__c = r1.Id);
        App_Product__c ap2 = new App_Product__c(Application__c=application.Id,Product__c = r2.Id);
        apList.add(ap1);
        apList.add(ap2); 
        insert apList; 
        Test.startTest(); 
        	list<App_Product__c> prodList = appProduct.appProducts(application.Id);        
        	list<App_Product__c> filter = appProduct.dataTableBuildFilter(prog.Id);
        Test.stopTest();
        	list<App_Product__c> nl = [select id from App_Product__c where application__c =: application.id]; 
        	system.assertEquals(2, nl.size());
        
    }
    @istest
    static void testSearch(){
	test.startTest();
        list<PricebookEntry> prodSearch = appProduct.searchProduct2('product', 'All', 'All');
        list<PricebookEntry> searchCatSearch = appProduct.searchProduct2('product', 'Herbicide - Premium', 'All');
        list<PricebookEntry> searchFamSearch = appProduct.searchProduct2('product', 'All', 'FMC');
        list<PricebookEntry> catSearch = appProduct.searchProduct2('null', 'Herbicide - Premium', 'All');
        list<PricebookEntry> famSearch = appProduct.searchProduct2('null', 'All', 'FMC');
        list<PricebookEntry> prodFamSearch = appProduct.searchProduct2('null', 'Herbicide - Premium', 'FMC');
     test.stopTest();
        system.assertNotEquals(0, prodSearch.size());
    }
    @istest
    static void getHistory(){
        //date for opp
        //September 9, 2023
        Date myDate = Date.newInstance(2023, 9, 9);
		//create test customer
        Account cust = new Account();
        cust.Name = 'AJ Hephner';
        cust.Type = 'Customer';
        cust.Customer_Name__c = 'AJ Hephner';
        insert cust;
        
        //product creation
        Id pricebookId = Test.getStandardPricebookId();
        //custom price books
        //custom
        PriceBook2 pb2=new PriceBook2();
        pb2.Name = 'test';
        pb2.IsActive = true;
        insert pb2; 
        //custom 3
        PriceBook2 pb3=new PriceBook2();
        pb3.Name = 'book 2';
        pb3.IsActive = true;
        insert pb3;

        //create product2 that is active
        product2 prod = new product2(name ='product', IsActive= True); 
        insert prod; 
        
        PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=prod.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert pbe; 
//create product2 that will be deactivated
        product2 widget = new product2(name ='widget', IsActive= True, Agency_Pricing__c=true); 
        insert widget; 
        
        PricebookEntry widgetpbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=widget.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert widgetpbe; 
 //normal product
         product2 rake = new product2(name ='rake', IsActive= True, Agency_Pricing__c=false); 
        insert rake; 
        
        PricebookEntry rakepbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=rake.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert rakepbe;  
 //zero margin
        product2 shovel = new product2(name ='shovel', IsActive= True, Agency_Pricing__c=false); 
        insert shovel; 
        
        PricebookEntry shovelpbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=shovel.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert shovelpbe; 
        
//Custom Price Book Entries
        PricebookEntry rakecustomPBE = new PricebookEntry(Pricebook2Id = pb2.Id, Product2Id=rake.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert rakecustomPBE;
        
        PricebookEntry shovelCustomPBE = new PricebookEntry(Pricebook2Id = pb2.Id, Product2Id=shovel.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert shovelCustomPBE;
        
        PricebookEntry widgetCustomPBE = new PricebookEntry(Pricebook2Id = pb3.Id, Product2Id=widget.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert widgetCustomPBE;
        
		PricebookEntry productPBE = new PricebookEntry(Pricebook2Id = pb3.Id, Product2Id=prod.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert productPBE;
//List of Price Book Ids
		List<String> pbIds = new List<String>(); 
        pbIds.add(pricebookId);
        pbIds.add(pb2.Id);
        pbIds.add(pb2.Id);
        
///Opportunity info
//location
        Schema.Location warehouse = new Schema.Location();
        warehouse.Name= 'ATS Warehouse';
        warehouse.Location_Number__c ='2';
        warehouse.IsInventoryLocation = true; 
        warehouse.LocationType = 'ATS'; 
        
         //get recordtype
 		//production 0122M000001ElAYQA0
 		//sandbox 01275000000CgcYAAS
        //create test opportunity
		opportunity opp = new opportunity(name = 'test name', accountID= cust.id, pricebook2id = pricebookId,recordTypeId= '0122M000001ElAYQA0',
                                         stagename='Working', closedate = myDate, Warehouse__c = warehouse.Id, Order_Type__c='EOP', Ship_Type__c='DS');
        
        insert opp;
        
        opportunitylineitem shovelli = new opportunitylineitem(opportunityid = opp.id, product2id = widget.Id, PricebookEntryId=widgetpbe.id,
                                                          unitprice= 4, quantity= 3, CPQ_Unit_Price__c = 4, CPQ_Margin__c=0.00); 
        insert shovelli; 
        
        opportunitylineitem nonAgencyli = new opportunitylineitem(opportunityid = opp.id, product2id = shovel.Id, PricebookEntryId=shovelpbe.id,
                                                          unitprice= 4, quantity= 3, CPQ_Unit_Price__c = 4, CPQ_Margin__c=0.00, Cost__c= 2); 
        insert nonAgencyli;
        
        list<OpportunityLineItem> agencyProd = new list<OpportunityLineItem>();
        agencyProd.add(shovelli);
        list<OpportunityLineItem> nonAgency = new list<OpportunityLineItem>();
        nonAgency.add(nonAgencyli);
        test.startTest();
        string newAppDate = '2024-10-09';
        	List<OpportunityLineItem> opli = appProduct.history(newAppDate, cust.Id);
        test.stopTest();
    }
    //@istest
    //static void testPricing(){
        //list<string> ids = new list<string>();
        	//ids.add(pbe2.Id); 
        //test.startTest();
        	//list<PricebookEntry> price = appProduct.pricing(ids);
        //test.stopTest();
    //}
    
    //here is how would test if we reverse and decide to pass params back to apex
  //  @isTest
   // static void testSearch(){
     //  Test.startTest();
     //   	product__c[] nothing = appProduct.searchProduct('', null); 
     //   	product__c[] all = appProduct.searchProduct('product', 'ALL'); 
	//		product__c[] herb = appProduct.searchProduct('product', 'Herbicide - Premium');
     //       product__c[] fung = appProduct.searchProduct('product', 'Chemicals-Fungicide'); 
     //  Test.stopTest();
   // }
      
}