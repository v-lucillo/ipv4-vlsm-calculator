	var ip_address = [];
	var host = [];
	let cidr = 32;
	let ip_map = get_ip_map();
	var network_addresses =  [];

	function get_ip_map(){
		var ip_map = [];
		for(let i = 0; i <= 32; i++)	{
			ip_map.push({
				host: Math.pow(2,i),
				cidr: cidr-i,
				octet: get_octet(i),
			})
		}
		return ip_map;
	}
	
	function init(){
		network_addresses.push(ip_address.join("."));
		for(let i = 0; i <  host.length ; i++){
			// every octet should only have 255, if exceeds add it to the preceeding octet
			// let equivalent_host = host[i]+=2;
			var ip_mapper = get_ip_mapper(host[i]);
			network_addresses.push(network_address(ip_mapper.host).join('.'));
		}
	}
	function get_ip_mapper(host){
		let equivalent_host = host+=2;
		return ip_map.find(object => object.host >= equivalent_host);
	}

	function network_address(increment){
		for(let j = (ip_address.length -1) ; j >=0; j--){
			var octet;
			if(j == 3){
				octet = ip_address[j] + (increment) ;
			}else{
				octet = ip_address[j]
			}
			if(Math.trunc(octet/256) >=  1){
				ip_address[(j - 1)] += Math.trunc(octet/256) ;
				ip_address[j] =  (octet%256)
			}else{
				ip_address[j] = octet
			}
		}
		return ip_address;
	}


	function get_octet(exponent){
		exponent += 1; 
		if(exponent <= 8){
			return 4;
		}
		if(exponent <=  16){
			return 3;
		}
		if(exponent <=  24){
			return 2;
		}
		if(exponent <=  32){
			return 3;
		}
	}


	function partial_result(){
		var result = [];
		for(let i = 0; i < network_addresses.length -1 ;i++){	
			var subnet_object = get_ip_mapper(host[i]);
			result.push({
				host: host[i],
				cidr: subnet_object.cidr,
				increment: subnet_object.host,
				octet: subnet_object.octet,
				network_address: network_addresses[i], 
				subnet_mask: get_subnetmask(subnet_object.cidr)
			});
		}
		return result;
	}

	function get_result(){
		var result = [];
		var partial_net_add = partial_result();
		var broadcast_address = network_properties(partial_net_add, 1);
		var last_usable_address = network_properties(partial_net_add, 2);
		var first_usable_addres = first_usable_address(partial_net_add);
		for(var i = 0; i< partial_net_add.length; i++){
			result.push({
				host: partial_net_add[i].host,
				cidr: partial_net_add[i].cidr,
				increment: partial_net_add[i].increment,
				octet: partial_net_add[i].octet,
				network_address: partial_net_add[i].network_address, 
				first_usable: first_usable_addres[i],
				last_usable: last_usable_address[i],
				broadcast_address: broadcast_address[i],
				subnet_mask: get_subnetmask(partial_net_add[i].cidr)
			});
		}
		return result;
	}

	function network_properties(network_addresses, property){ // property = 1 =  broadcast address | property = 2 = lastusable adddress
		var result = [];
		for(var i =  0; i < network_addresses.length; i++){
			var net_add =  network_addresses[i].network_address.split(".");
			var increment =  network_addresses[i].increment;
			for(let j = (net_add.length -1) ; j >=0; j--){
				var octet;
				if(j == 3){
					octet = parseInt(net_add[j]) + (increment - property) ;
				}else{
					octet = parseInt(net_add[j])
				}
				if(Math.trunc(octet/256) >=  1){
					net_add[(j - 1)] = parseInt(net_add[(j - 1)]) + Math.trunc(octet/256) ;
					net_add[j] =  (octet%256)
				}else{
					net_add[j] = octet
				}
			}
			result.push(net_add.join("."));
		}
		return result;
	}

	function first_usable_address(network_address){
		var result = [];
		for(var i = 0; i < network_address.length; i++){
			var net_add =  network_address[i].network_address.split(".");
			net_add[3] =  parseInt(net_add[3]) + 1;
			result.push(net_add.join("."));
		}
		return result;
	}

	

	function get_subnetmask(cidr){
		var host_addressess = [0,128,192,224,240,248,252,254];
		var subnet_mask = "";
		let network_address =  Math.trunc(cidr/8);
		let host_address = cidr%8;
		for(let i = 0 ; i < network_address; i++){
			subnet_mask += "255.";
		}
		subnet_mask += host_addressess[parseInt(host_address)];
		if(subnet_mask.split(".").length <= 4){
			let diff =  4 - subnet_mask.split(".").length;
			subnet_mask += ".";
			for(let j = 0; j < diff; j++){
				subnet_mask += "0.";
			}
		}

		return subnet_mask.slice(0,-1);
	}

	var table =  $("table").DataTable({
            dom: 'Bfrtip',
            buttons: [
                'copy', 'csv', 'excel', 'pdf', 'print'
            ],
			columns: [
				{data: "host"},
				{data: "network_address"},
				{data: "first_usable"},
				{data: "last_usable"},
				{data: "broadcast_address"},
				{data: "cidr"},
				{data: "subnet_mask"},
				{data: "octet"},
				{data: "increment"},
			]
        });

	var host_input = $('select[name="host[]"]');
	host_input.select2({
		tags: true,
		placeholder: "Enter host (ex. 100, 200, 283)"
	});

	$("button[name='calculate_button']").on('click', function(){
		ip_address;
		host;
		cidr = 32;
		ip_map = get_ip_map();
		network_addresses =  [];
		host = host_input.val().sort((a,b) => b-a).map(i=>Number(i));
		ip_address = $('input[name="ip_address"]').val().split(".").map(i=>Number(i));
		let check_ip = check_ip_address(ip_address);
		let check_hosts = check_host(host);
		reset_error();
		if(check_ip != true || check_hosts != true){
			if(check_ip != true){
				$("small#ip_address").text(check_ip);
			}
			if(check_hosts != true){
				$("small#host").text(check_hosts);
			}
		}else{
			init();
			reset_error();
			let results = get_result();
			table.clear();
			table.rows.add(results);
			table.draw();		
		}
	});
	
	function reset_error(){
		$("small#host").text("");
		$("small#ip_address").text("");
	}
	function check_ip_address(ip_address){
		var count_255 = 0;
		if(ip_address.length != 4){
			return "Invalid ip address";
		}
		for(let i = 0; i < ip_address.length; i++){	
			if (isNaN(parseInt(ip_address[i]))) {
				return "Invalid ip address, string detected";
			}
			
			if(ip_address[i] > 255){
				return "Invalid ip address, grater than 255 in IP address segments detected";
			}
			
			if(ip_address[i] == 255){
				count_255++;
			}
		}
		if(count_255 == 4){
			return "Invalid host, the given address can't accommodate host";
		}

		return true;
	}

	function check_host(host){
		for(let  i = 0; i < host.length; i++){
			if (isNaN(parseInt(host[i]))) {
				return "Invalid host, please make sure that all are numbers";
			}

			if(parseInt(host[i]) <= 0){
				return "Invalid host, please make sure no negative numbers or 0 are included";
			}
		}
		
		if(host.length == 0){
			return "Invalid host, please make sure to include atleast 1";
		}
		return true;
	}
