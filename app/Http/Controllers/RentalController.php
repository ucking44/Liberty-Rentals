<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Rental;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RentalController extends Controller
{
    public function index()
    {
        $rentals = Rental::with('book')->where('user_id', Auth::id())->get();

        if(count($rentals))
        {
            return response()->json([
                'status' => true,
                'data'   => $rentals
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'No Rental Was Found!'  
        ]);
    }

    public function rent(Request $request)
    {
        $validated = $request->validate([
            'book_id' => 'required|integer'
        ]);

        //// CHECK IF BOOK EXISTS
        if (Book::where('id', $request->book_id)->doesntExist())
        {
            return response()->json([
                'status' => false,
                'message' => 'Book Not Found!',
            ], 404);
        }

        $book = Book::findOrFail($request->book_id);

        $alreadyRented = Rental::where('user_id', Auth::id())
            ->where('book_id', $book->id)
            ->whereNull('returned_at')
            ->exists();

        if ($alreadyRented)
        {
            return response()->json(['error' => 'Already rented'], 400);
        }

        if ($book->available_copies <= 0)
        {
            return response()->json(['error' => 'No available copy'], 400);
        }

        $rental = Rental::create([
            'user_id'   => Auth::id(),
            'book_id'   => $book->id,
            'rented_at' => now(),
        ]);

        $book->decrement('available_copies');

        return response()->json([
            'status' => true,
            'data'   => $rental
        ], 201);
    }

    public function returnBook($rentalId)
    {
        $rental = Rental::find($rentalId);

        //// CHECK IF RENTAL EXISTS
        if (!$rental) 
        {
            return response()->json([
                'status' => false, 
                'error' => 'Rental Not Found'
            ], 404);
        }

        if ($rental->user_id !== Auth::id()) 
        {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($rental->returned_at) 
        {
            return response()->json(['error' => 'Already returned'], 400);
        }

        $rental->update(['returned_at' => now()]);
        $rental->book->increment('available_copies');

        return response()->json([
            'status'  => true,
            'message' => 'Book Returned Successfully!'
        ]);
    }
}
