<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    protected $fillable = [
        'title', 
        'author', 
        'genre', 
        'published_year', 
        'total_copies', 
        'available_copies'
    ];

    public function rentals() 
    {
        return $this->hasMany(Rental::class);
    }
}
