export interface Truck {
    id: string;
    truck_no: string;
    fc_expiry?: string;
    insurance_expiry?: string;
    np_expiry?: string;
}

export interface Driver {
    id: string;
    name: string;
    license_no?: string;
    phone?: string;
    aadhar_no?: string;
    address?: string;
    photo_url?: string;
}

export interface Trip {
    id: string;
    truck_id: string;
    driver1_id: string;
    driver2_id?: string;
    start_date: string;
    end_date?: string;
    start_km: number;
    end_km: number;
    diesel_amount: number;
    diesel_liters: number;
    status: 'ongoing' | 'completed';
    truck?: Truck; // Joined
}

export interface Load {
    id: string;
    trip_id: string;
    loading_date: string;
    from_location: string;
    to_location: string;
    transporter: string;
    freight_amount: number;
    note: string;
    pay_term: 'To Pay' | 'Advance';
    advance_amount: number;
    balance_amount: number;
    courier_details?: CourierDetails;
}

export interface CourierDetails {
    id: string;
    load_id: string;
    received_date: string;
    vendor: string;
    delivery_date: string;
}

export interface Expense {
    id: string;
    trip_id: string;
    category: 'AdBlue' | 'Salary' | 'Loading' | 'Unloading' | 'RTO' | 'Fastag' | 'Billing' | 'Other';
    title?: string;
    amount: number;
    liters?: number;
    percentage?: number;
}

export interface Tyre {
    id: string;
    truck_id: string;
    make: string;
    price: number;
    fitment_date: string;
    fitting_km: number;
    removal_date: string;
    removal_km: number;
    remarks: string;
}
