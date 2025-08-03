<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rental extends Model
{
    protected $fillable = [
        'user_id', 
        'book_id', 
        'rented_at', 
        'returned_at'
    ];

    public function user() 
    {
        return $this->belongsTo(User::class);
    }

    public function book() 
    {
        return $this->belongsTo(Book::class);
    }
}
