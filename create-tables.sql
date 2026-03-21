create table if not exists cart(
    id serial not null unique
);

create table if not exists cashier(
    name varchar(255) not null unique,
    password varchar(255) not null,
    
    cart_id integer not null,
    foreign key (cart_id) references cart(id)
);

create table if not exists product(
    id serial not null unique,
    
    price integer not null,
    product_type varchar(255) not null,

    quantity integer,
    
    cart_id integer not null,
    foreign key (cart_id) references cart(id) on delete cascade
);

create table if not exists receipt(
    id serial not null unique,

    time_stamp varchar(255) not null,
    
    cart_id integer not null,
    foreign key (cart_id) references cart(id) on delete cascade,
    
    cashier_name varchar(255) not null,
    foreign key (cashier_name) references cashier(name) on delete cascade
);

create table if not exists bogo(
    id serial not null unique,

    qualifier_id integer not null,
    foreign key (qualifier_id) references product(id) on delete cascade,

    reward_id integer not null,
    foreign key (reward_id) references product(id) on delete cascade,

    receipt_id integer not null,
    foreign key (receipt_id) references receipt(id) on delete cascade
);

create table if not exists discount(
    id serial not null unique,

    amount float not null,

    receipt_id integer not null,
    foreign key (receipt_id) references receipt(id) on delete cascade
);

create table if not exists inventory(
    product_type varchar(255) not null,
    price integer not null,
    unique (product_type, price)
);

insert into inventory(product_type, price) values('Vegetable', 1) on conflict do nothing;
insert into inventory(product_type, price) values('Fruit', 2) on conflict do nothing;
insert into inventory(product_type, price) values('Smoothie', 3) on conflict do nothing;
insert into inventory(product_type, price) values('Vegetable', 4) on conflict do nothing;
insert into inventory(product_type, price) values('Fruit', 5) on conflict do nothing;
insert into inventory(product_type, price) values('Smoothie', 6) on conflict do nothing;
insert into inventory(product_type, price) values('Vegetable', 7) on conflict do nothing;
insert into inventory(product_type, price) values('Fruit', 8) on conflict do nothing;
insert into inventory(product_type, price) values('Smoothie', 9) on conflict do nothing;
insert into inventory(product_type, price) values('Smoothie', 10) on conflict do nothing;