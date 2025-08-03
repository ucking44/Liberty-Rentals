<?php

namespace App\Http\Controllers;

use Validator;
use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $allBooks = Book::all();

        if(count($allBooks) <= 0)
        {
            return response()->json([
                'status' => false,
                'message' => 'No Book Was Found!'
            ], 404);
        }

        return response()->json([
            'status'  => true,
            'data'    => $allBooks
        ], 200);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        if (Book::where('id', $id)->exists())
        {
            $book = Book::findOrFail($id);

            return response()->json([
                'status' => true,
                'data'   => $book
            ], 200);
        } 
        else 
        {
            return response()->json([
                'status'  => false,
                'message' => 'Book Does Not Exist'
            ], 404);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (!auth()->user()->is_admin) 
        {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make(request()->all(), [
            'title'  => 'required|string|max:255',
            'author' => 'required|string|max:255',
        ]);

        if($validator->fails())
        {
            return response()->json($validator->errors()->toJson(), 400);
        }

        $book = new Book();
        $book->title = $request->title;
        $book->author = $request->author;
        $book->genre = $request->genre;
        $book->published_year = $request->published_year;
        $book->total_copies = $request->total_copies;
        $book->available_copies = $request->available_copies;
        $book->save();

        return response()->json([
            'status'  => true,
            'data'    => $book,
            'message' => 'Book Was Created Successfully!'
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        if (!auth()->user()->is_admin) 
        {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if (Book::where('id', $id)->exists())
        {
            $book = Book::findOrFail($id);

            $book->update($request->all());

            return response()->json([
                'status'  => true,
                'data'    => $book,
                'message' => 'Book Was Updated Successfully!'
            ], 200);
        }
        else
        {
            return response()->json([
                'status'  => false,
                'message' => 'Book with the ID of ' . '(' . $id . ')' . ' Does Not Exist'
            ], 404);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        if (!auth()->user()->is_admin) 
        {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if (Book::where('id', '=', $id)->exists())
        {
            $book = Book::findOrFail($id);
            $book->delete();

            return response()->json([
                'status'  => true,
                'message' => 'Book Was Deleted Successfully!'
            ], 204);
        }
        else
        {
            return response()->json([
                'status'  => false,
                'message' => 'Book with the ID of ' . '(' . $id . ')' . ' Does Not Exist'
            ], 404);
        }
    }
}
