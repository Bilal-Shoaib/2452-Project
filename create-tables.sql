create table if not exists cashier(
    name varchar(255) not null unique,
    password varchar(255) not null
);

create table if not exists cart(
    id serial not null unique,
    
    cashier_name varchar(255) not null,
    foreign key (cashier_name) references cashier(name) on delete cascade
);

create table if not exists product(
    id serial not null unique,
    
    price integer not null,
    product_type varchar(255) not null,
    
    cart_id integer not null,
    foreign key (cart_id) references cart(id) on delete cascade
);

create table if not exists receipt(
    id serial not null unique,
    
    cart_id integer not null,
    foreign key (cart_id) references cart(id) on delete cascade,
    
    cashier_name varchar(255) not null,
    foreign key (cashier_name) references cashier(name) on delete cascade
);

create table if not exists inventory(
    product_type varchar(255) not null unique,
    price integer not null
);

insert into inventory(product_type, price) values('Fruit', 2) on conflict do nothing;
insert into inventory(product_type, price) values('Vegetable', 1) on conflict do nothing;