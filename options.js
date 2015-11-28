window.onload=function(){
	chrome.storage.local.get(function(storage){
		document.getElementById("threads").value=storage.threads;
		html='';
		html+='Статус : '+storage.status+'<br>';
		document.getElementById("info").innerHTML=html;
		console.log(storage.my_tabs);
		if(storage.my_tabs){
			html+='В хранилище '+storage.my_tabs.length+' записей<br>';
			document.getElementById("info").innerHTML=html;
			for(var i=0;i<storage.my_tabs.length;i++){
				html+="<br>\n"+(i+1)+')<a href="'+storage.my_tabs[i].url+'">'+storage.my_tabs[i].name+'</a><br>Страна: '+storage.my_tabs[i].country+'<br>Количество матчей: '+storage.my_tabs[i].rows_array.length+' (из них детально собрано '+storage.my_tabs[i].parsed_rows+')<br>';
				if(storage.my_tabs[i].file){
					html+='<a href="'+storage.my_tabs[i].file+'" download="'+storage.my_tabs[i].name+'.csv">Скачать '+storage.my_tabs[i].name+'.csv</a><br>\n';
				}
				document.getElementById("info").innerHTML=html;
			}
		}else{
			html+='В хранилище нет записей<br>';
			document.getElementById("info").innerHTML=html;
		}
	});
	document.getElementById("threads").onchange=function(){
		chrome.storage.local.set({'threads':document.getElementById("threads").value});
	}
	document.getElementById("reset").onclick=function(){
		chrome.runtime.sendMessage({action:"reset"}, function(){
			window.location.href=window.location.href;
		});

	}
/*
	document.getElementById("one_file").onchange=function(){
		chrome.storage.local.set({'one_file':document.getElementById("one_file").checked});
	}
	document.getElementById("generate_one_file").onclick=function(){
		chrome.storage.local.get(function(storage){
			var data=";Название чемпионата;Дата матча;Время матча;Команда 1;Команда 2;Первый тайм Команда 1;Первый тайм Команда 2;Счет Команда 1;Счет Команда 2;Красные карты Команда 1; Красные карты Команда 2;Два и больше голов Команда 1;Два и больше голов Команда 2\r\n";
			for(var i=0;i<storage.my_tabs.length;i++){
				for(var j=0;j<storage.my_tabs[i].rows_array.length;j++){
					var date=storage.my_tabs[i].rows_array[j].time.split(" ")[0];
					var time=storage.my_tabs[i].rows_array[j].time.split(" ")[1];
					storage.my_tabs[i].rows_array[j].score.replace(" ","");
					var score_1=storage.my_tabs[i].rows_array[j].score.split(":")[0];
					var score_2=storage.my_tabs[i].rows_array[j].score.split(":")[1];
					if(storage.my_tabs[i].rows_array[j].first_time){
						storage.my_tabs[i].rows_array[j].first_time.replace(" ","");
						var first_score_1=storage.my_tabs[i].rows_array[j].first_time.split(":")[0];
						var first_score_2=storage.my_tabs[i].rows_array[j].first_time.split(":")[1];
					}else{
						var first_score_1="-";
						var first_score_2="-";
					}
					if(!storage.my_tabs[i].rows_array[j].goal_away){storage.my_tabs[i].rows_array[j].goal_away="-";}
					if(!storage.my_tabs[i].rows_array[j].goal_home){storage.my_tabs[i].rows_array[j].goal_home="-";}
					data+='"'+storage.my_tabs[i].rows_array[j].is_parsed+'";"'+storage.my_tabs[i].name+'";"'+date+'";"'+time+'";"'+storage.my_tabs[i].rows_array[j].team_home+'";"'+storage.my_tabs[i].rows_array[j].team_away+'";"'+first_score_1+'";"'+first_score_2+'";"'+score_1+'";"'+score_2+'";"'+storage.my_tabs[i].rows_array[j].red_card_home+'";"'+storage.my_tabs[i].rows_array[j].red_card_away+'";"'+storage.my_tabs[i].rows_array[j].goal_home+'";"'+storage.my_tabs[i].rows_array[j].goal_away+'"\r\n';
				}
			}
			data=new Blob(["\ufeff", [data]],{type:'text/csv'});
			var file=window.URL.createObjectURL(data);
			console.log(file+" generated");
			chrome.storage.local.set({"file":file});
			html='<a href="'+file+'" download="all_data.csv">Скачать all_data.csv</a><br>'+html;
			document.getElementById("info").innerHTML=html;
		});
	}
*/
}
chrome.runtime.onMessage.addListener(
	function(request,sender,callback){
		switch(request.action){
			default:console.log("Unknown request!\n"+request.action);
		}
	}
);